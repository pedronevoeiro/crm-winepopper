import { NextResponse } from 'next/server'
import { authenticateWebhook } from '@/lib/webhook-auth'
import { db } from '@/lib/db'
import { logError } from '@/lib/logger'

export async function GET(request: Request) {
  const authError = authenticateWebhook(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const stageSlug = searchParams.get('stage')
  const stageId = searchParams.get('stage_id')
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)

  const supabase = db()

  try {
    // Resolve stage
    let targetStageId: string | null = stageId ?? null

    if (stageSlug && !targetStageId) {
      const candidateId = `ps-${stageSlug}`

      // Try matching by id first
      const { data: stageById } = await supabase
        .from('crm_pipeline_stages')
        .select('id')
        .eq('id', candidateId)
        .limit(1)
        .single()

      if (stageById) {
        targetStageId = stageById.id
      } else {
        // Try matching by name (normalized)
        const { data: allStages } = await supabase
          .from('crm_pipeline_stages')
          .select('id, name')

        if (allStages) {
          const normalizedSlug = stageSlug.toLowerCase().replace(/-/g, ' ')
          const match = allStages.find(
            (s) =>
              s.name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') === normalizedSlug
          )
          if (match) targetStageId = match.id
        }
      }
    }

    if (!targetStageId) {
      return NextResponse.json(
        { error: 'Provide ?stage=<slug> or ?stage_id=<id>. Example: ?stage=sem-contato' },
        { status: 400 }
      )
    }

    // Fetch deals for the stage with related data
    const { data: deals, error: dealsError } = await supabase
      .from('crm_deals')
      .select(`
        id,
        title,
        stage_id,
        contact_id,
        company_id,
        expected_quantity,
        budget_range,
        urgency,
        source,
        created_at,
        stage_entered_at
      `)
      .eq('stage_id', targetStageId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (dealsError) throw new Error(`Failed to fetch deals: ${dealsError.message}`)

    // Get stage name
    const { data: stageInfo } = await supabase
      .from('crm_pipeline_stages')
      .select('name')
      .eq('id', targetStageId)
      .single()

    // Enrich with contact and company info
    const contactIds = [...new Set((deals ?? []).map((d) => d.contact_id).filter(Boolean))]
    const companyIds = [...new Set((deals ?? []).map((d) => d.company_id).filter(Boolean))]

    const [contactsResult, companiesResult] = await Promise.all([
      contactIds.length > 0
        ? supabase
            .from('crm_contacts')
            .select('id, name, mobile, email')
            .in('id', contactIds)
        : { data: [] },
      companyIds.length > 0
        ? supabase
            .from('crm_companies')
            .select('id, name')
            .in('id', companyIds)
        : { data: [] },
    ])

    const contactMap = new Map((contactsResult.data ?? []).map((c) => [c.id, c]))
    const companyMap = new Map((companiesResult.data ?? []).map((c) => [c.id, c]))

    const result = (deals ?? []).map((deal) => {
      const contact = contactMap.get(deal.contact_id)
      const company = deal.company_id ? companyMap.get(deal.company_id) : null
      return {
        id: deal.id,
        title: deal.title,
        stage_id: deal.stage_id,
        stage_name: stageInfo?.name,
        contact_id: contact?.id,
        contact_name: contact?.name,
        contact_mobile: contact?.mobile,
        contact_email: contact?.email,
        company_name: company?.name ?? null,
        expected_quantity: deal.expected_quantity,
        budget_range: deal.budget_range,
        urgency: deal.urgency,
        source: deal.source,
        created_at: deal.created_at,
        stage_entered_at: deal.stage_entered_at,
      }
    })

    return NextResponse.json({
      count: result.length,
      stage: targetStageId,
      deals: result,
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    await logError('error', 'Webhook deals GET falhou', { error: errorMessage, stageSlug, stageId }, err instanceof Error ? err.stack : undefined)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
