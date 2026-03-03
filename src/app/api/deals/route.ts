import { NextResponse } from 'next/server'
import { deals, pipelineStages, companies, contacts, users, tasks } from '@/lib/data'
import type { CrmDeal } from '@/types/database'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const stageId = searchParams.get('stage_id')
  const ownerId = searchParams.get('owner_id')
  const search = searchParams.get('search')?.toLowerCase()

  let result = deals.map((deal) => ({
    ...deal,
    stage: pipelineStages.find((s) => s.id === deal.stage_id),
    company: companies.find((c) => c.id === deal.company_id) ?? null,
    contact: contacts.find((c) => c.id === deal.contact_id)!,
    owner: users.find((u) => u.id === deal.owner_id) ?? null,
    next_task: tasks.find((t) => t.deal_id === deal.id && t.status === 'pending') ?? null,
  }))

  if (stageId) result = result.filter((d) => d.stage_id === stageId)
  if (ownerId) result = result.filter((d) => d.owner_id === ownerId)
  if (search) {
    result = result.filter(
      (d) =>
        d.title.toLowerCase().includes(search) ||
        d.company?.name.toLowerCase().includes(search) ||
        d.contact?.name.toLowerCase().includes(search)
    )
  }

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const body = await request.json()

  const newDeal: CrmDeal = {
    id: `d${Date.now()}`,
    title: body.title,
    stage_id: body.stage_id,
    company_id: body.company_id ?? null,
    contact_id: body.contact_id,
    owner_id: body.owner_id ?? null,
    value: body.value ?? null,
    product_interest: body.product_interest ?? null,
    expected_quantity: body.expected_quantity ?? null,
    expected_close_date: body.expected_close_date ?? null,
    lost_reason: null,
    source: body.source ?? null,
    priority: body.priority ?? 'medium',
    position: body.position ?? 0,
    budget_range: body.budget_range ?? null,
    urgency: body.urgency ?? null,
    stage_entered_at: new Date().toISOString(),
    won_at: null,
    lost_at: null,
    created_by: body.created_by ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  deals.push(newDeal)
  return NextResponse.json(newDeal, { status: 201 })
}
