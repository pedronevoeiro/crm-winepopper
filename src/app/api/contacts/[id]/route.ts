import { NextResponse } from 'next/server'
import { contacts, companies, deals, activities } from '@/lib/data'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const contact = contacts.find((c) => c.id === id)
  if (!contact) return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })

  const company = companies.find((c) => c.id === contact.company_id) ?? null
  const contactDeals = deals.filter((d) => d.contact_id === id)
  const contactActivities = activities
    .filter((a) => a.contact_id === id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json({
    ...contact,
    company,
    deals: contactDeals,
    activities: contactActivities,
  })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idx = contacts.findIndex((c) => c.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })

  const body = await request.json()
  contacts[idx] = { ...contacts[idx], ...body, updated_at: new Date().toISOString() }
  return NextResponse.json(contacts[idx])
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idx = contacts.findIndex((c) => c.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })

  contacts.splice(idx, 1)
  return NextResponse.json({ success: true })
}
