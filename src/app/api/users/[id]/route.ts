import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const patchSchema = z.object({
  role: z.enum(['admin', 'manager', 'seller', 'viewer']).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Only admins can change roles
    const { data: me } = await supabase
      .from('crm_user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (me?.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem alterar permissoes' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('crm_user_profiles')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar usuario' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Erro inesperado em PATCH /api/users/[id]:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
