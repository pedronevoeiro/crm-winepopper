import { NextResponse } from 'next/server'
import { authenticateWebhook } from '@/lib/webhook-auth'
import { leadWebhookSchema } from '@/lib/webhook-schemas'
import { companies, contacts, deals, pipelineStages, activities } from '@/lib/data'
import type { CrmCompany, CrmContact, CrmDeal, CrmActivity } from '@/types/database'

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
  const now = new Date().toISOString()

  // Find or create company
  let companyId: string | null = null
  let companyRecord: CrmCompany | undefined

  if (data.empresa && data.empresa.trim() !== '') {
    companyRecord = companies.find(
      (c) => c.name.toLowerCase() === data.empresa.toLowerCase()
    )

    if (!companyRecord) {
      companyRecord = {
        id: `co${Date.now()}`,
        name: data.empresa,
        trade_name: null,
        cnpj: null,
        industry: null,
        size: null,
        website: null,
        email: null,
        phone: null,
        cep: null,
        street: null,
        number: null,
        complement: null,
        neighborhood: null,
        city: null,
        state: null,
        notes: null,
        tags: [],
        created_by: null,
        created_at: now,
        updated_at: now,
      }
      companies.push(companyRecord)
    }

    companyId = companyRecord.id
  }

  // Deduplicate contact by email or mobile
  let contactRecord: CrmContact | undefined
  if (data.email) {
    contactRecord = contacts.find(
      (c) => c.email && c.email.toLowerCase() === data.email!.toLowerCase()
    )
  }
  if (!contactRecord && data.numero_formatado) {
    contactRecord = contacts.find(
      (c) => c.mobile === data.numero_formatado
    )
  }

  const contactIsNew = !contactRecord
  if (!contactRecord) {
    contactRecord = {
      id: `ct${Date.now()}`,
      company_id: companyId,
      name: data.fullName,
      email: data.email || null,
      phone: null,
      mobile: data.numero_formatado || null,
      position: null,
      is_decision_maker: false,
      notes: null,
      tags: ['lead-automatico'],
      source: data.source,
      created_by: null,
      created_at: now,
      updated_at: now,
    }
    contacts.push(contactRecord)
  } else {
    // Update existing contact's company if it was missing
    if (!contactRecord.company_id && companyId) {
      contactRecord.company_id = companyId
      contactRecord.updated_at = now
    }
  }

  // Find "Sem Contato" stage (position 0, not won/lost)
  const semContatoStage = pipelineStages.find(
    (s) => s.position === 0 && !s.is_won && !s.is_lost
  )
  if (!semContatoStage) {
    return NextResponse.json(
      { error: 'Pipeline stage "Sem Contato" not found' },
      { status: 500 }
    )
  }

  // Build deal title
  const dealLabel = data.empresa || data.fullName
  const qty = data.tamanho_pedido || '?'
  const dealTitle = `${qty} un. - ${dealLabel}`

  const newDeal: CrmDeal = {
    id: `d${Date.now()}`,
    title: dealTitle,
    stage_id: semContatoStage.id,
    company_id: companyId,
    contact_id: contactRecord.id,
    owner_id: null,
    value: null,
    product_interest: null,
    expected_quantity: data.tamanho_pedido ? parseInt(data.tamanho_pedido, 10) || null : null,
    expected_close_date: null,
    lost_reason: null,
    source: data.source,
    priority: 'medium',
    position: deals.filter((d) => d.stage_id === semContatoStage.id).length,
    budget_range: data.faixa_valor || null,
    urgency: data.urgencia || null,
    stage_entered_at: now,
    won_at: null,
    lost_at: null,
    created_by: null,
    created_at: now,
    updated_at: now,
  }
  deals.push(newDeal)

  // Log activity
  const sourceLabel = data.source === 'meta_ads' ? 'Meta Ads' : 'Landing Page'
  const activity: CrmActivity = {
    id: `a${Date.now()}`,
    deal_id: newDeal.id,
    contact_id: contactRecord.id,
    company_id: companyId,
    user_id: null,
    type: 'deal_created',
    content: `Lead recebido via webhook (${sourceLabel})`,
    metadata: {
      source: data.source,
      tamanho_pedido: data.tamanho_pedido,
      faixa_valor: data.faixa_valor,
      urgencia: data.urgencia,
    },
    created_at: now,
  }
  activities.push(activity)

  return NextResponse.json(
    {
      success: true,
      deal: {
        id: newDeal.id,
        title: newDeal.title,
        stage_id: newDeal.stage_id,
        stage_name: semContatoStage.name,
      },
      contact: {
        id: contactRecord.id,
        name: contactRecord.name,
        is_new: contactIsNew,
      },
      company: companyRecord
        ? {
            id: companyRecord.id,
            name: companyRecord.name,
            is_new: companyRecord.created_at === now,
          }
        : null,
    },
    { status: 201 }
  )
}
