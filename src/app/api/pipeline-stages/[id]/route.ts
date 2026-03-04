import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    // Only allow updating specific fields
    const allowedFields: Record<string, unknown> = {}
    if (body.name !== undefined) allowedFields.name = body.name
    if (body.color !== undefined) allowedFields.color = body.color
    if (body.position !== undefined) allowedFields.position = body.position
    if (body.is_won !== undefined) allowedFields.is_won = body.is_won
    if (body.is_lost !== undefined) allowedFields.is_lost = body.is_lost

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
    }

    const { data, error } = await db()
      .from('crm_pipeline_stages')
      .update(allowedFields)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar estágio:', error)
      return NextResponse.json({ error: 'Estágio não encontrado' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Erro inesperado em PATCH /api/pipeline-stages/[id]:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = db()

    // Check if any deals reference this stage
    const { count, error: countError } = await supabase
      .from('crm_deals')
      .select('id', { count: 'exact', head: true })
      .eq('stage_id', id)

    if (countError) {
      console.error('Erro ao verificar deals do estágio:', countError)
      return NextResponse.json({ error: 'Erro ao verificar dependências' }, { status: 500 })
    }

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir: ${count} negócio(s) ainda está(ão) neste estágio` },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('crm_pipeline_stages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar estágio:', error)
      return NextResponse.json({ error: 'Erro ao deletar estágio' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro inesperado em DELETE /api/pipeline-stages/[id]:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
