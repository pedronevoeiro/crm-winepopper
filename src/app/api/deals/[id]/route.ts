import { NextResponse } from 'next/server'
import { deals, pipelineStages, companies, contacts, users, tasks, activities } from '@/lib/data'
import type { CrmActivity } from '@/types/database'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deal = deals.find((d) => d.id === id)
  if (!deal) return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 })

  const dealActivities = activities
    .filter((a) => a.deal_id === id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const dealTasks = tasks.filter((t) => t.deal_id === id)

  return NextResponse.json({
    ...deal,
    stage: pipelineStages.find((s) => s.id === deal.stage_id),
    company: companies.find((c) => c.id === deal.company_id) ?? null,
    contact: contacts.find((c) => c.id === deal.contact_id),
    owner: users.find((u) => u.id === deal.owner_id) ?? null,
    activities: dealActivities,
    tasks: dealTasks,
  })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idx = deals.findIndex((d) => d.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 })

  const body = await request.json()
  const oldDeal = deals[idx]

  // Registrar mudança de estágio
  if (body.stage_id && body.stage_id !== oldDeal.stage_id) {
    const fromStage = pipelineStages.find((s) => s.id === oldDeal.stage_id)
    const toStage = pipelineStages.find((s) => s.id === body.stage_id)

    const activity: CrmActivity = {
      id: `a${Date.now()}`,
      deal_id: id,
      contact_id: oldDeal.contact_id,
      company_id: oldDeal.company_id,
      user_id: body.user_id ?? null,
      type: toStage?.is_won ? 'deal_won' : toStage?.is_lost ? 'deal_lost' : 'stage_change',
      content: `Movido de ${fromStage?.name} para ${toStage?.name}`,
      metadata: { from: fromStage?.name, to: toStage?.name },
      created_at: new Date().toISOString(),
    }
    activities.push(activity)

    body.stage_entered_at = new Date().toISOString()
    if (toStage?.is_won) body.won_at = new Date().toISOString()
    if (toStage?.is_lost) body.lost_at = new Date().toISOString()
  }

  deals[idx] = { ...oldDeal, ...body, updated_at: new Date().toISOString() }
  return NextResponse.json(deals[idx])
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idx = deals.findIndex((d) => d.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 })

  deals.splice(idx, 1)
  return NextResponse.json({ success: true })
}
