import { NextResponse } from 'next/server'
import { authenticateWebhook } from '@/lib/webhook-auth'
import { leadWebhookSchema } from '@/lib/webhook-schemas'
import { db } from '@/lib/db'
import { logError } from '@/lib/logger'

export async function POST(request: Request) {
  const authError = authenticateWebhook(request)
  if (authError) return authError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = leadWebhookSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const data = parsed.data
  const supabase = db()

  try {
    // 1. Create/upsert company
    let companyId: string | null = null
    let companyIsNew = false

    if (data.empresa && data.empresa.trim() !== '') {
      const { data: existingCompany } = await supabase
        .from('crm_companies')
        .select('id, created_at')
        .ilike('name', data.empresa)
        .limit(1)
        .single()

      if (existingCompany) {
        companyId = existingCompany.id
      } else {
        const { data: newCompany, error: companyError } = await supabase
          .from('crm_companies')
          .insert({ name: data.empresa })
          .select('id')
          .single()

        if (companyError) throw new Error(`Failed to create company: ${companyError.message}`)
        companyId = newCompany.id
        companyIsNew = true
      }
    }

    // 2. Create contact (deduplicate by email or mobile)
    let contactId: string | null = null
    let contactIsNew = false

    if (data.email) {
      const { data: existingByEmail } = await supabase
        .from('crm_contacts')
        .select('id, company_id')
        .ilike('email', data.email)
        .limit(1)
        .single()

      if (existingByEmail) {
        contactId = existingByEmail.id
        // Update company_id if it was missing
        if (!existingByEmail.company_id && companyId) {
          await supabase
            .from('crm_contacts')
            .update({ company_id: companyId, updated_at: new Date().toISOString() })
            .eq('id', contactId)
        }
      }
    }

    if (!contactId && data.numero_formatado) {
      const { data: existingByMobile } = await supabase
        .from('crm_contacts')
        .select('id, company_id')
        .eq('mobile', data.numero_formatado)
        .limit(1)
        .single()

      if (existingByMobile) {
        contactId = existingByMobile.id
        if (!existingByMobile.company_id && companyId) {
          await supabase
            .from('crm_contacts')
            .update({ company_id: companyId, updated_at: new Date().toISOString() })
            .eq('id', contactId)
        }
      }
    }

    if (!contactId) {
      const { data: newContact, error: contactError } = await supabase
        .from('crm_contacts')
        .insert({
          name: data.fullName,
          email: data.email || null,
          mobile: data.numero_formatado || null,
          company_id: companyId,
          source: data.source,
          tags: ['lead-automatico'],
        })
        .select('id')
        .single()

      if (contactError) throw new Error(`Failed to create contact: ${contactError.message}`)
      contactId = newContact.id
      contactIsNew = true
    }

    // 3. Get first pipeline stage (position 0, not won/lost)
    const { data: firstStage, error: stageError } = await supabase
      .from('crm_pipeline_stages')
      .select('id, name')
      .eq('is_won', false)
      .eq('is_lost', false)
      .order('position', { ascending: true })
      .limit(1)
      .single()

    if (stageError || !firstStage) {
      throw new Error('Pipeline stage "Sem Contato" not found')
    }

    // 4. Build deal title and get position
    const dealLabel = data.empresa || data.fullName
    const qty = data.tamanho_pedido || '?'
    const dealTitle = `${qty} un. - ${dealLabel}`

    const { count: stageCount } = await supabase
      .from('crm_deals')
      .select('id', { count: 'exact', head: true })
      .eq('stage_id', firstStage.id)

    // 5. Create deal
    const { data: newDeal, error: dealError } = await supabase
      .from('crm_deals')
      .insert({
        title: dealTitle,
        stage_id: firstStage.id,
        company_id: companyId,
        contact_id: contactId,
        expected_quantity: data.tamanho_pedido ? parseInt(data.tamanho_pedido, 10) || null : null,
        source: data.source,
        priority: 'medium',
        position: stageCount ?? 0,
        budget_range: data.faixa_valor || null,
        urgency: data.urgencia || null,
        stage_entered_at: new Date().toISOString(),
      })
      .select('id, title, stage_id')
      .single()

    if (dealError) throw new Error(`Failed to create deal: ${dealError.message}`)

    // 6. Create 'deal_created' activity
    const sourceLabel = data.source === 'meta_ads' ? 'Meta Ads' : 'Landing Page'
    const { error: activityError } = await supabase
      .from('crm_activities')
      .insert({
        deal_id: newDeal.id,
        contact_id: contactId,
        company_id: companyId,
        type: 'deal_created',
        content: `Lead recebido via webhook (${sourceLabel})`,
        metadata: {
          source: data.source,
          tamanho_pedido: data.tamanho_pedido,
          faixa_valor: data.faixa_valor,
          urgencia: data.urgencia,
        },
      })

    if (activityError) {
      await logError('warn', 'Failed to create deal_created activity', { error: activityError.message, dealId: newDeal.id })
    }

    return NextResponse.json(
      {
        success: true,
        deal: {
          id: newDeal.id,
          title: newDeal.title,
          stage_id: newDeal.stage_id,
          stage_name: firstStage.name,
        },
        contact: {
          id: contactId,
          name: data.fullName,
          is_new: contactIsNew,
        },
        company: companyId
          ? {
              id: companyId,
              name: data.empresa,
              is_new: companyIsNew,
            }
          : null,
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    await logError('critical', 'Webhook leads falhou', { error: errorMessage, payload: data }, err instanceof Error ? err.stack : undefined)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
