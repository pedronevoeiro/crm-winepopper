import { NextResponse } from 'next/server'
import { authenticateWebhook } from '@/lib/webhook-auth'
import { stageUpdateSchema } from '@/lib/webhook-schemas'
import { db } from '@/lib/db'
import { logError } from '@/lib/logger'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticateWebhook(request)
  if (authError) return authError

  const { id } = await params
  const supabase = db()

  try {
    // Fetch existing deal
    const { data: oldDeal, error: dealFetchError } = await supabase
      .from('crm_deals')
      .select('id, stage_id, contact_id, company_id')
      .eq('id', id)
      .single()

    if (dealFetchError || !oldDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = stageUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { stage_id: newStageId } = parsed.data

    // Verify new stage exists
    const { data: newStage, error: stageFetchError } = await supabase
      .from('crm_pipeline_stages')
      .select('id, name, is_won, is_lost')
      .eq('id', newStageId)
      .single()

    if (stageFetchError || !newStage) {
      return NextResponse.json(
        { error: `Stage '${newStageId}' not found` },
        { status: 400 }
      )
    }

    // No-op if already in this stage
    if (oldDeal.stage_id === newStageId) {
      return NextResponse.json({
        success: true,
        message: 'Deal already in this stage',
        deal_id: id,
        stage_id: newStageId,
        stage_name: newStage.name,
      })
    }

    // Get old stage name for activity log
    const { data: oldStage } = await supabase
      .from('crm_pipeline_stages')
      .select('name')
      .eq('id', oldDeal.stage_id)
      .single()

    const now = new Date().toISOString()

    // Log activity
    const activityType = newStage.is_won ? 'deal_won' : newStage.is_lost ? 'deal_lost' : 'stage_change'
    const { error: activityError } = await supabase
      .from('crm_activities')
      .insert({
        deal_id: id,
        contact_id: oldDeal.contact_id,
        company_id: oldDeal.company_id,
        type: activityType,
        content: `Movido de ${oldStage?.name ?? '?'} para ${newStage.name} (via webhook)`,
        metadata: { from: oldStage?.name, to: newStage.name, via: 'webhook' },
      })

    if (activityError) {
      await logError('warn', 'Failed to create stage_change activity', { error: activityError.message, dealId: id })
    }

    // Apply stage change
    const updatePayload: Record<string, unknown> = {
      stage_id: newStageId,
      stage_entered_at: now,
      updated_at: now,
    }
    if (newStage.is_won) updatePayload.won_at = now
    if (newStage.is_lost) updatePayload.lost_at = now

    const { error: updateError } = await supabase
      .from('crm_deals')
      .update(updatePayload)
      .eq('id', id)

    if (updateError) throw new Error(`Failed to update deal stage: ${updateError.message}`)

    return NextResponse.json({
      success: true,
      deal_id: id,
      previous_stage: oldStage?.name,
      new_stage: newStage.name,
      stage_id: newStageId,
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    await logError('critical', 'Webhook deal stage update falhou', { error: errorMessage, dealId: id }, err instanceof Error ? err.stack : undefined)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
