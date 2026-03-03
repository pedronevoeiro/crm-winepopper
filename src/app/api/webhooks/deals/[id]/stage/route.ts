import { NextResponse } from 'next/server'
import { authenticateWebhook } from '@/lib/webhook-auth'
import { stageUpdateSchema } from '@/lib/webhook-schemas'
import { deals, pipelineStages, activities } from '@/lib/data'
import type { CrmActivity } from '@/types/database'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticateWebhook(request)
  if (authError) return authError

  const { id } = await params

  const dealIdx = deals.findIndex((d) => d.id === id)
  if (dealIdx === -1) {
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
  const oldDeal = deals[dealIdx]

  const newStage = pipelineStages.find((s) => s.id === newStageId)
  if (!newStage) {
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

  const oldStage = pipelineStages.find((s) => s.id === oldDeal.stage_id)
  const now = new Date().toISOString()

  // Log activity
  const activity: CrmActivity = {
    id: `a${Date.now()}`,
    deal_id: id,
    contact_id: oldDeal.contact_id,
    company_id: oldDeal.company_id,
    user_id: null,
    type: newStage.is_won ? 'deal_won' : newStage.is_lost ? 'deal_lost' : 'stage_change',
    content: `Movido de ${oldStage?.name} para ${newStage.name} (via webhook)`,
    metadata: { from: oldStage?.name, to: newStage.name, via: 'webhook' },
    created_at: now,
  }
  activities.push(activity)

  // Apply stage change
  deals[dealIdx] = {
    ...oldDeal,
    stage_id: newStageId,
    stage_entered_at: now,
    won_at: newStage.is_won ? now : oldDeal.won_at,
    lost_at: newStage.is_lost ? now : oldDeal.lost_at,
    updated_at: now,
  }

  return NextResponse.json({
    success: true,
    deal_id: id,
    previous_stage: oldStage?.name,
    new_stage: newStage.name,
    stage_id: newStageId,
  })
}
