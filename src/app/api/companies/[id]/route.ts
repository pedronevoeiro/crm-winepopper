import { NextResponse } from 'next/server'
import { companies, contacts, deals, activities } from '@/lib/data'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const company = companies.find((c) => c.id === id)
  if (!company) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })

  const companyContacts = contacts.filter((c) => c.company_id === id)
  const companyDeals = deals.filter((d) => d.company_id === id)
  const companyActivities = activities
    .filter((a) => a.company_id === id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json({
    ...company,
    contacts: companyContacts,
    deals: companyDeals,
    activities: companyActivities,
  })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idx = companies.findIndex((c) => c.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })

  const body = await request.json()
  companies[idx] = { ...companies[idx], ...body, updated_at: new Date().toISOString() }
  return NextResponse.json(companies[idx])
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idx = companies.findIndex((c) => c.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })

  companies.splice(idx, 1)
  return NextResponse.json({ success: true })
}
