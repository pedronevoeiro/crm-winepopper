import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import crypto from 'crypto'

const inviteSchema = z.object({
  email: z.string().email('E-mail invalido'),
  crm_role: z.enum(['admin', 'manager', 'seller', 'viewer']).optional(),
  erp_role: z.enum(['admin', 'manager', 'operator', 'viewer']).optional(),
  target_app: z.enum(['crm', 'erp', 'both']),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    // Check if the current user is an admin
    const supabase = createAdminClient()
    const { data: profile } = await supabase
      .from('crm_user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem enviar convites' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { email, crm_role, erp_role, target_app } = parsed.data

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('crm_user_profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ja existe um usuario com este e-mail' },
        { status: 409 },
      )
    }

    // Generate token and expiration (7 days)
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: invitation, error: insertError } = await supabase
      .from('user_invitations')
      .insert({
        email,
        invited_by: session.user.id,
        target_app,
        crm_role: crm_role ?? null,
        erp_role: erp_role ?? null,
        token,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar convite:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar convite' },
        { status: 500 },
      )
    }

    // Try to send invite email via Resend
    let emailSent = false
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
      try {
        const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'
        const registerUrl = `${baseUrl}/register?token=${token}`

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Winepopper CRM <noreply@winepopper.com.br>',
            to: [email],
            subject: 'Convite para o Winepopper CRM',
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
                <h2 style="color: #18181b;">Voce foi convidado!</h2>
                <p style="color: #3f3f46; line-height: 1.6;">
                  Voce recebeu um convite para acessar o <strong>Winepopper CRM</strong>.
                  Clique no botao abaixo para criar sua conta:
                </p>
                <a href="${registerUrl}"
                   style="display: inline-block; background: #18181b; color: #fff; padding: 12px 24px;
                          border-radius: 6px; text-decoration: none; margin: 16px 0;">
                  Criar minha conta
                </a>
                <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
                  Este convite expira em 7 dias. Se voce nao solicitou este convite, ignore este e-mail.
                </p>
              </div>
            `,
          }),
        })

        emailSent = res.ok
        if (!res.ok) {
          const errBody = await res.text()
          console.error('Erro ao enviar e-mail de convite:', errBody)
        }
      } catch (emailErr) {
        console.error('Falha ao enviar e-mail de convite:', emailErr)
      }
    }

    return NextResponse.json(
      { invitation, emailSent },
      { status: 201 },
    )
  } catch (err) {
    console.error('Erro inesperado em POST /api/admin/invite:', err)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
