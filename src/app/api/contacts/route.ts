import { NextResponse } from 'next/server'
import { contacts, companies } from '@/lib/data'
import type { CrmContact } from '@/types/database'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.toLowerCase()
  const companyId = searchParams.get('company_id')

  let result = contacts.map((contact) => ({
    ...contact,
    company: companies.find((c) => c.id === contact.company_id) ?? null,
  }))

  if (search) {
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search) ||
        c.company?.name.toLowerCase().includes(search) ||
        c.position?.toLowerCase().includes(search)
    )
  }

  if (companyId) {
    result = result.filter((c) => c.company_id === companyId)
  }

  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const body = await request.json()

  const newContact: CrmContact = {
    id: `ct${Date.now()}`,
    company_id: body.company_id ?? null,
    name: body.name,
    email: body.email ?? null,
    phone: body.phone ?? null,
    mobile: body.mobile ?? null,
    position: body.position ?? null,
    is_decision_maker: body.is_decision_maker ?? false,
    notes: body.notes ?? null,
    tags: body.tags ?? [],
    source: body.source ?? null,
    created_by: body.created_by ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  contacts.push(newContact)
  return NextResponse.json(newContact, { status: 201 })
}
