import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase()
    const companyId = searchParams.get('company_id')

    let query = db()
      .from('crm_contacts')
      .select('*, company:crm_companies(*)')
      .order('created_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,position.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar contatos:', error)
      return NextResponse.json({ error: 'Erro ao buscar contatos' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Erro inesperado em GET /api/contacts:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data, error } = await db()
      .from('crm_contacts')
      .insert({
        company_id: body.company_id ?? null,
        name: body.name,
        email: body.email ?? null,
        phone: body.phone ?? null,
        mobile: body.mobile ?? null,
        position: body.position ?? null,
        is_decision_maker: body.is_decision_maker ?? false,
        notes: body.notes ?? null,
        tags: body.tags ?? [],
        source: body.source ?? null,
        created_by: body.created_by ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar contato:', error)
      return NextResponse.json({ error: 'Erro ao criar contato' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Erro inesperado em POST /api/contacts:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
