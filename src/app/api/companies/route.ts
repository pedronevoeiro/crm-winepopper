import { NextResponse } from 'next/server'
import { companies } from '@/lib/data'
import type { CrmCompany } from '@/types/database'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.toLowerCase()

  let result = [...companies]

  if (search) {
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.trade_name?.toLowerCase().includes(search) ||
        c.cnpj?.includes(search) ||
        c.city?.toLowerCase().includes(search)
    )
  }

  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const body = await request.json()

  const newCompany: CrmCompany = {
    id: `co${Date.now()}`,
    name: body.name,
    trade_name: body.trade_name ?? null,
    cnpj: body.cnpj ?? null,
    industry: body.industry ?? null,
    size: body.size ?? null,
    website: body.website ?? null,
    email: body.email ?? null,
    phone: body.phone ?? null,
    cep: body.cep ?? null,
    street: body.street ?? null,
    number: body.number ?? null,
    complement: body.complement ?? null,
    neighborhood: body.neighborhood ?? null,
    city: body.city ?? null,
    state: body.state ?? null,
    notes: body.notes ?? null,
    tags: body.tags ?? [],
    created_by: body.created_by ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  companies.push(newCompany)
  return NextResponse.json(newCompany, { status: 201 })
}
