import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = db()

    // Fetch deal with joins
    const { data: deal, error: dealError } = await supabase
      .from('crm_deals')
      .select('*, stage:crm_pipeline_stages(*), funnel:crm_funnels(*), company:crm_companies(*), contact:crm_contacts(*), owner:crm_user_profiles!crm_deals_owner_id_fkey(*)')
      .eq('id', id)
      .single()

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 })
    }

    // Fetch related data in parallel
    const [activitiesRes, tasksRes, dealItemsRes, chatRes] = await Promise.all([
      supabase
        .from('crm_activities')
        .select('*, user:crm_user_profiles(*)')
        .eq('deal_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('crm_tasks')
        .select('*')
        .eq('deal_id', id)
        .order('due_date', { ascending: true }),
      supabase
        .from('crm_deal_items')
        .select('*')
        .eq('deal_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('chat_conversations')
        .select('*')
        .eq('deal_id', id)
        .order('created_at', { ascending: false }),
    ])

    return NextResponse.json({
      ...deal,
      activities: activitiesRes.data ?? [],
      tasks: tasksRes.data ?? [],
      deal_items: dealItemsRes.data ?? [],
      chat_conversations: chatRes.data ?? [],
    })
  } catch (err) {
    console.error('Erro inesperado em GET /api/deals/[id]:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = db()
    const body = await request.json()

    // Fetch current deal to check for stage change
    const { data: oldDeal, error: fetchError } = await supabase
      .from('crm_deals')
      .select('*, stage:crm_pipeline_stages(*)')
      .eq('id', id)
      .single()

    if (fetchError || !oldDeal) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 })
    }

    // If stage changed, create activity
    if (body.stage_id && body.stage_id !== oldDeal.stage_id) {
      const { data: toStage } = await supabase
        .from('crm_pipeline_stages')
        .select('*')
        .eq('id', body.stage_id)
        .single()

      const fromStageName = (oldDeal.stage as { name?: string })?.name ?? 'Desconhecido'
      const toStageName = toStage?.name ?? 'Desconhecido'

      const activityType = toStage?.is_won ? 'deal_won' : toStage?.is_lost ? 'deal_lost' : 'stage_change'

      await supabase.from('crm_activities').insert({
        deal_id: id,
        contact_id: oldDeal.contact_id,
        company_id: oldDeal.company_id,
        user_id: body.user_id ?? null,
        type: activityType,
        content: `Movido de ${fromStageName} para ${toStageName}`,
        metadata: { from: fromStageName, to: toStageName },
      })

      body.stage_entered_at = new Date().toISOString()
      if (toStage?.is_won) body.won_at = new Date().toISOString()
      if (toStage?.is_lost) body.lost_at = new Date().toISOString()
    }

    // Remove user_id from update payload (it's only for activity tracking)
    const { user_id: _userId, ...updatePayload } = body

    const { data, error } = await supabase
      .from('crm_deals')
      .update({ ...updatePayload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar deal:', error)
      return NextResponse.json({ error: 'Erro ao atualizar negócio' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Erro inesperado em PATCH /api/deals/[id]:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { error } = await db()
      .from('crm_deals')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar deal:', error)
      return NextResponse.json({ error: 'Erro ao deletar negócio' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro inesperado em DELETE /api/deals/[id]:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
