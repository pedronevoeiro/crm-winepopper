import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    // If marking as completed, set completed_at timestamp
    if (body.status === 'completed') {
      const { data: current } = await db()
        .from('crm_tasks')
        .select('status')
        .eq('id', id)
        .single()

      if (current && current.status !== 'completed') {
        body.completed_at = new Date().toISOString()
      }
    }

    const { data, error } = await db()
      .from('crm_tasks')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar tarefa:', error)
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Erro inesperado em PATCH /api/tasks/[id]:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { error } = await db()
      .from('crm_tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar tarefa:', error)
      return NextResponse.json({ error: 'Erro ao deletar tarefa' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro inesperado em DELETE /api/tasks/[id]:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
