import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dealId = searchParams.get('deal_id')
    const contactId = searchParams.get('contact_id')
    const companyId = searchParams.get('company_id')

    let query = db()
      .from('crm_activities')
      .select('*, user:crm_user_profiles(*)')
      .order('created_at', { ascending: false })

    if (dealId) query = query.eq('deal_id', dealId)
    if (contactId) query = query.eq('contact_id', contactId)
    if (companyId) query = query.eq('company_id', companyId)

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar atividades:', error)
      return NextResponse.json({ error: 'Erro ao buscar atividades' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Erro inesperado em GET /api/activities:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data, error } = await db()
      .from('crm_activities')
      .insert({
        deal_id: body.deal_id ?? null,
        contact_id: body.contact_id ?? null,
        company_id: body.company_id ?? null,
        user_id: body.user_id ?? null,
        type: body.type,
        content: body.content ?? null,
        metadata: body.metadata ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar atividade:', error)
      return NextResponse.json({ error: 'Erro ao criar atividade' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Erro inesperado em POST /api/activities:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
