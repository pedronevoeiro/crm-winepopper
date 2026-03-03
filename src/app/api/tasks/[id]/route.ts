import { NextResponse } from 'next/server'
import { tasks } from '@/lib/data'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })

  const body = await request.json()

  // Se marcando como concluída, registrar timestamp
  if (body.status === 'completed' && tasks[idx].status !== 'completed') {
    body.completed_at = new Date().toISOString()
  }

  tasks[idx] = { ...tasks[idx], ...body, updated_at: new Date().toISOString() }
  return NextResponse.json(tasks[idx])
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })

  tasks.splice(idx, 1)
  return NextResponse.json({ success: true })
}
