import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token ausente' })
    }

    const supabase = createAdminClient()

    const { data: invitation, error } = await supabase
      .from('user_invitations')
      .select('email, target_app, crm_role, erp_role, expires_at, accepted_at')
      .eq('token', token)
      .single()

    if (error || !invitation) {
      return NextResponse.json({ valid: false, error: 'Convite nao encontrado' })
    }

    if (invitation.accepted_at) {
      return NextResponse.json({ valid: false, error: 'Convite ja foi utilizado' })
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Convite expirado' })
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      target_app: invitation.target_app,
      crm_role: invitation.crm_role,
      erp_role: invitation.erp_role,
    })
  } catch (err) {
    console.error('Erro inesperado em GET /api/admin/invite/validate:', err)
    return NextResponse.json(
      { valid: false, error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
