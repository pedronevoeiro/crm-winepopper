import { NextResponse } from 'next/server'

const WEBHOOK_API_KEY = process.env.CRM_WEBHOOK_API_KEY

export function authenticateWebhook(request: Request): NextResponse | null {
  if (!WEBHOOK_API_KEY) {
    return NextResponse.json(
      { error: 'Webhook API key not configured on server' },
      { status: 500 }
    )
  }

  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header. Expected: Bearer <api_key>' },
      { status: 401 }
    )
  }

  const token = authHeader.slice(7)

  if (token !== WEBHOOK_API_KEY) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 403 }
    )
  }

  return null
}
