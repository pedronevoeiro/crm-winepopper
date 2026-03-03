import { NextResponse } from 'next/server'
import { activities, users } from '@/lib/data'
import type { CrmActivity } from '@/types/database'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dealId = searchParams.get('deal_id')
  const contactId = searchParams.get('contact_id')
  const companyId = searchParams.get('company_id')

  let result = activities.map((a) => ({
    ...a,
    user: users.find((u) => u.id === a.user_id) ?? null,
  }))

  if (dealId) result = result.filter((a) => a.deal_id === dealId)
  if (contactId) result = result.filter((a) => a.contact_id === contactId)
  if (companyId) result = result.filter((a) => a.company_id === companyId)

  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const body = await request.json()

  const newActivity: CrmActivity = {
    id: `a${Date.now()}`,
    deal_id: body.deal_id ?? null,
    contact_id: body.contact_id ?? null,
    company_id: body.company_id ?? null,
    user_id: body.user_id ?? null,
    type: body.type,
    content: body.content ?? null,
    metadata: body.metadata ?? null,
    created_at: new Date().toISOString(),
  }

  activities.push(newActivity)
  return NextResponse.json(newActivity, { status: 201 })
}
