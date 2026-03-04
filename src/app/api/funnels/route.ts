import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { data, error } = await db()
      .from('crm_funnels')
      .select('*')
      .order('position', { ascending: true })

    if (error) {
      console.error('Erro ao buscar funis:', error)
      return NextResponse.json({ error: 'Erro ao buscar funis' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Erro inesperado em GET /api/funnels:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
