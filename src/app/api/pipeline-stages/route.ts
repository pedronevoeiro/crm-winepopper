import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const funnelId = searchParams.get('funnel_id')

    let query = db()
      .from('crm_pipeline_stages')
      .select('*')
      .order('position', { ascending: true })

    if (funnelId) {
      query = query.eq('funnel_id', funnelId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar estágios:', error)
      return NextResponse.json({ error: 'Erro ao buscar estágios' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Erro inesperado em GET /api/pipeline-stages:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data, error } = await db()
      .from('crm_pipeline_stages')
      .insert({
        name: body.name,
        position: body.position,
        color: body.color ?? null,
        is_won: body.is_won ?? false,
        is_lost: body.is_lost ?? false,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar estágio:', error)
      return NextResponse.json({ error: 'Erro ao criar estágio' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Erro inesperado em POST /api/pipeline-stages:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    // Bulk reorder: expects array of { id, position }
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Esperado array de { id, position }' }, { status: 400 })
    }

    const supabase = db()

    // Update each stage's position
    const updates = body.map((item: { id: string; position: number }) =>
      supabase
        .from('crm_pipeline_stages')
        .update({ position: item.position })
        .eq('id', item.id)
    )

    const results = await Promise.all(updates)

    const hasError = results.find((r) => r.error)
    if (hasError?.error) {
      console.error('Erro ao reordenar estágios:', hasError.error)
      return NextResponse.json({ error: 'Erro ao reordenar estágios' }, { status: 500 })
    }

    // Return updated list
    const { data } = await supabase
      .from('crm_pipeline_stages')
      .select('*')
      .order('position', { ascending: true })

    return NextResponse.json(data)
  } catch (err) {
    console.error('Erro inesperado em PUT /api/pipeline-stages:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
