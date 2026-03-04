import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = db()

    const { data: contact, error } = await supabase
      .from('crm_contacts')
      .select('*, company:crm_companies(*)')
      .eq('id', id)
      .single()

    if (error || !contact) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
    }

    // Fetch related data in parallel
    const [dealsRes, activitiesRes] = await Promise.all([
      supabase
        .from('crm_deals')
        .select('*')
        .eq('contact_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('crm_activities')
        .select('*, user:crm_user_profiles(*)')
        .eq('contact_id', id)
        .order('created_at', { ascending: false }),
    ])

    return NextResponse.json({
      ...contact,
      deals: dealsRes.data ?? [],
      activities: activitiesRes.data ?? [],
    })
  } catch (err) {
    console.error('Erro inesperado em GET /api/contacts/[id]:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const { data, error } = await db()
      .from('crm_contacts')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar contato:', error)
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Erro inesperado em PATCH /api/contacts/[id]:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { error } = await db()
      .from('crm_contacts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar contato:', error)
      return NextResponse.json({ error: 'Erro ao deletar contato' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro inesperado em DELETE /api/contacts/[id]:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
