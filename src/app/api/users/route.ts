import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { data, error } = await db()
      .from('crm_user_profiles')
      .select('*')
      .order('display_name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Erro inesperado em GET /api/users:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
