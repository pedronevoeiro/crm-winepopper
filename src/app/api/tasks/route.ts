import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const dealId = searchParams.get('deal_id')
    const assignedTo = searchParams.get('assigned_to')
    const filter = searchParams.get('filter') // today, overdue, upcoming

    let query = db()
      .from('crm_tasks')
      .select('*, deal:crm_deals(*), contact:crm_contacts(*), assigned_user:crm_user_profiles!crm_tasks_assigned_to_fkey(*)')

    if (status) query = query.eq('status', status)
    if (dealId) query = query.eq('deal_id', dealId)
    if (assignedTo) query = query.eq('assigned_to', assignedTo)

    // Date-based filters
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    const nextWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString()

    if (filter === 'today') {
      query = query
        .eq('status', 'pending')
        .not('due_date', 'is', null)
        .gte('due_date', today)
        .lt('due_date', tomorrow)
    } else if (filter === 'overdue') {
      query = query
        .eq('status', 'pending')
        .not('due_date', 'is', null)
        .lt('due_date', today)
    } else if (filter === 'upcoming') {
      query = query
        .eq('status', 'pending')
        .not('due_date', 'is', null)
        .gte('due_date', tomorrow)
        .lte('due_date', nextWeek)
    }

    // Sort: pending first, then by due_date
    query = query
      .order('status', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar tarefas:', error)
      return NextResponse.json({ error: 'Erro ao buscar tarefas' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Erro inesperado em GET /api/tasks:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data, error } = await db()
      .from('crm_tasks')
      .insert({
        title: body.title,
        description: body.description ?? null,
        type: body.type,
        priority: body.priority ?? 'medium',
        status: 'pending',
        due_date: body.due_date ?? null,
        completed_at: null,
        deal_id: body.deal_id ?? null,
        contact_id: body.contact_id ?? null,
        assigned_to: body.assigned_to ?? null,
        created_by: body.created_by ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar tarefa:', error)
      return NextResponse.json({ error: 'Erro ao criar tarefa' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Erro inesperado em POST /api/tasks:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
