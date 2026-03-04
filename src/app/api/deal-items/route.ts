import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dealId = searchParams.get('deal_id')

    if (!dealId) {
      return NextResponse.json({ error: 'Parâmetro deal_id é obrigatório' }, { status: 400 })
    }

    const { data, error } = await db()
      .from('crm_deal_items')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar itens do deal:', error)
      return NextResponse.json({ error: 'Erro ao buscar itens do negócio' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Erro inesperado em GET /api/deal-items:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.deal_id || !body.product_id || !body.product_name || body.quantity == null) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: deal_id, product_id, product_name, quantity' },
        { status: 400 }
      )
    }

    const { data, error } = await db()
      .from('crm_deal_items')
      .insert({
        deal_id: body.deal_id,
        product_id: body.product_id,
        product_name: body.product_name,
        quantity: body.quantity,
        unit_price: body.unit_price ?? 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar item do deal:', error)
      return NextResponse.json({ error: 'Erro ao adicionar item ao negócio' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Erro inesperado em POST /api/deal-items:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
