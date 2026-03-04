import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req: NextRequest & { auth: { user?: { id: string } } | null }) => {
  const isLoggedIn = !!req.auth
  const path = req.nextUrl.pathname
  const isAuthPage = path.startsWith('/login') || path.startsWith('/register')
  const isApiAuth = path.startsWith('/api/auth')
  const isWebhook = path.startsWith('/api/webhooks')

  if (isApiAuth || isWebhook) return NextResponse.next()
  if (isAuthPage) {
    if (isLoggedIn) return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
    return NextResponse.next()
  }
  if (!isLoggedIn) return NextResponse.redirect(new URL('/login', req.nextUrl))
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/admin/invite/validate|api/admin/register).*)'],
}
