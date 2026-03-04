import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const registerSchema = z.object({
  token: z.string().min(1, 'Token obrigatorio'),
  display_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { token, display_name, password } = parsed.data
    const supabase = createAdminClient()

    // Look up invitation
    const { data: invitation, error: invError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (invError || !invitation) {
      return NextResponse.json(
        { error: 'Convite nao encontrado' },
        { status: 404 },
      )
    }

    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'Convite ja foi utilizado' },
        { status: 410 },
      )
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Convite expirado' },
        { status: 410 },
      )
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: { name: display_name },
    })

    if (authError || !authUser.user) {
      console.error('Erro ao criar usuario no Supabase Auth:', authError)
      return NextResponse.json(
        { error: 'Erro ao criar conta de usuario' },
        { status: 500 },
      )
    }

    const userId = authUser.user.id

    // Create CRM profile if crm_role is set
    if (invitation.crm_role) {
      const { error: crmError } = await supabase
        .from('crm_user_profiles')
        .insert({
          id: userId,
          email: invitation.email,
          display_name,
          role: invitation.crm_role,
          active: true,
        })

      if (crmError) {
        console.error('Erro ao criar perfil CRM:', crmError)
      }
    }

    // Create ERP profile if erp_role is set
    if (invitation.erp_role) {
      const { error: erpError } = await supabase
        .from('erp_user_profiles')
        .insert({
          id: userId,
          email: invitation.email,
          display_name,
          role: invitation.erp_role,
          active: true,
        })

      if (erpError) {
        console.error('Erro ao criar perfil ERP:', erpError)
      }
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('user_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Erro ao marcar convite como aceito:', updateError)
    }

    return NextResponse.json(
      { message: 'Conta criada com sucesso' },
      { status: 201 },
    )
  } catch (err) {
    console.error('Erro inesperado em POST /api/admin/register:', err)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
