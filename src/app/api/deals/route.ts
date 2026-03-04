import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stageId = searchParams.get('stage_id')
    const funnelId = searchParams.get('funnel_id')
    const ownerId = searchParams.get('owner_id')
    const search = searchParams.get('search')?.toLowerCase()
    const sortBy = searchParams.get('sort_by') // created_at | value | priority

    let query = db()
      .from('crm_deals')
      .select('*, stage:crm_pipeline_stages(*), company:crm_companies(*), contact:crm_contacts(*), owner:crm_user_profiles!crm_deals_owner_id_fkey(*), next_task:crm_tasks(id,title,due_date,type,priority,status)')

    if (stageId) query = query.eq('stage_id', stageId)
    if (funnelId) query = query.eq('funnel_id', funnelId)
    if (ownerId) query = query.eq('owner_id', ownerId)
    if (search) {
      query = query.or(`title.ilike.%${search}%,crm_companies.name.ilike.%${search}%,crm_contacts.name.ilike.%${search}%`)
    }

    // Sorting
    if (sortBy === 'value') {
      query = query.order('value', { ascending: false, nullsFirst: false })
    } else if (sortBy === 'priority') {
      // priority enum order: urgent > high > medium > low
      query = query.order('priority', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar deals:', error)
      return NextResponse.json({ error: 'Erro ao buscar negócios' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Erro inesperado em GET /api/deals:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data, error } = await db()
      .from('crm_deals')
      .insert({
        title: body.title,
        stage_id: body.stage_id,
        company_id: body.company_id ?? null,
        contact_id: body.contact_id,
        owner_id: body.owner_id ?? null,
        value: body.value ?? null,
        product_interest: body.product_interest ?? null,
        expected_quantity: body.expected_quantity ?? null,
        expected_close_date: body.expected_close_date ?? null,
        lost_reason: null,
        source: body.source ?? null,
        priority: body.priority ?? 'medium',
        position: body.position ?? 0,
        budget_range: body.budget_range ?? null,
        urgency: body.urgency ?? null,
        stage_entered_at: new Date().toISOString(),
        created_by: body.created_by ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar deal:', error)
      return NextResponse.json({ error: 'Erro ao criar negócio' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Erro inesperado em POST /api/deals:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
