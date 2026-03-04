import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase()

    let query = db()
      .from('crm_companies')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,trade_name.ilike.%${search}%,cnpj.ilike.%${search}%,city.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar empresas:', error)
      return NextResponse.json({ error: 'Erro ao buscar empresas' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Erro inesperado em GET /api/companies:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data, error } = await db()
      .from('crm_companies')
      .insert({
        name: body.name,
        trade_name: body.trade_name ?? null,
        cnpj: body.cnpj ?? null,
        industry: body.industry ?? null,
        size: body.size ?? null,
        website: body.website ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        cep: body.cep ?? null,
        street: body.street ?? null,
        number: body.number ?? null,
        complement: body.complement ?? null,
        neighborhood: body.neighborhood ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        notes: body.notes ?? null,
        tags: body.tags ?? [],
        created_by: body.created_by ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar empresa:', error)
      return NextResponse.json({ error: 'Erro ao criar empresa' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Erro inesperado em POST /api/companies:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
