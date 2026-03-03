import { NextResponse } from 'next/server'
import { tasks, deals, contacts, users } from '@/lib/data'
import type { CrmTask } from '@/types/database'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const dealId = searchParams.get('deal_id')
  const assignedTo = searchParams.get('assigned_to')
  const filter = searchParams.get('filter') // today, overdue, upcoming

  let result = tasks.map((task) => ({
    ...task,
    deal: deals.find((d) => d.id === task.deal_id) ?? null,
    contact: contacts.find((c) => c.id === task.contact_id) ?? null,
    assigned_user: users.find((u) => u.id === task.assigned_to) ?? null,
  }))

  if (status) result = result.filter((t) => t.status === status)
  if (dealId) result = result.filter((t) => t.deal_id === dealId)
  if (assignedTo) result = result.filter((t) => t.assigned_to === assignedTo)

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  if (filter === 'today') {
    result = result.filter((t) => {
      if (!t.due_date || t.status !== 'pending') return false
      const d = new Date(t.due_date)
      return d >= today && d < tomorrow
    })
  } else if (filter === 'overdue') {
    result = result.filter((t) => {
      if (!t.due_date || t.status !== 'pending') return false
      return new Date(t.due_date) < today
    })
  } else if (filter === 'upcoming') {
    result = result.filter((t) => {
      if (!t.due_date || t.status !== 'pending') return false
      const d = new Date(t.due_date)
      return d >= tomorrow && d <= nextWeek
    })
  }

  result.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    return 0
  })

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const body = await request.json()

  const newTask: CrmTask = {
    id: `t${Date.now()}`,
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  tasks.push(newTask)
  return NextResponse.json(newTask, { status: 201 })
}
