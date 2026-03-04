import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { error } = await db()
      .from('crm_deal_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar item do deal:', error)
      return NextResponse.json({ error: 'Erro ao remover item do negócio' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro inesperado em DELETE /api/deal-items/[id]:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
