import { NextResponse } from 'next/server'
import { authenticateWebhook } from '@/lib/webhook-auth'
import { deals, pipelineStages, contacts, companies } from '@/lib/data'

export async function GET(request: Request) {
  const authError = authenticateWebhook(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const stageSlug = searchParams.get('stage')
  const stageId = searchParams.get('stage_id')
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)

  // Resolve stage
  let targetStageId: string | null = stageId ?? null

  if (stageSlug && !targetStageId) {
    const stage = pipelineStages.find(
      (s) => s.id === `ps-${stageSlug}` ||
        s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') ===
        stageSlug.toLowerCase().replace(/-/g, ' ')
    )
    if (stage) targetStageId = stage.id
  }

  if (!targetStageId) {
    return NextResponse.json(
      { error: 'Provide ?stage=<slug> or ?stage_id=<id>. Example: ?stage=sem-contato' },
      { status: 400 }
    )
  }

  const result = deals
    .filter((d) => d.stage_id === targetStageId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, limit)
    .map((deal) => {
      const contact = contacts.find((c) => c.id === deal.contact_id)
      const company = companies.find((c) => c.id === deal.company_id)
      const stage = pipelineStages.find((s) => s.id === deal.stage_id)
      return {
        id: deal.id,
        title: deal.title,
        stage_id: deal.stage_id,
        stage_name: stage?.name,
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
}
