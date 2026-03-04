import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = db()

    const { data: company, error } = await supabase
      .from('crm_companies')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    // Fetch related data in parallel
    const [contactsRes, dealsRes, activitiesRes] = await Promise.all([
      supabase
        .from('crm_contacts')
        .select('*')
        .eq('company_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('crm_deals')
        .select('*')
        .eq('company_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('crm_activities')
        .select('*, user:crm_user_profiles(*)')
        .eq('company_id', id)
        .order('created_at', { ascending: false }),
    ])

    return NextResponse.json({
      ...company,
      contacts: contactsRes.data ?? [],
      deals: dealsRes.data ?? [],
      activities: activitiesRes.data ?? [],
    })
  } catch (err) {
    console.error('Erro inesperado em GET /api/companies/[id]:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const { data, error } = await db()
      .from('crm_companies')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar empresa:', error)
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Erro inesperado em PATCH /api/companies/[id]:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { error } = await db()
      .from('crm_companies')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar empresa:', error)
      return NextResponse.json({ error: 'Erro ao deletar empresa' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro inesperado em DELETE /api/companies/[id]:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
