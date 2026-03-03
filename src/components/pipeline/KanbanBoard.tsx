'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { DealCard } from './DealCard'
import type { CrmPipelineStage, CrmDealWithRelations } from '@/types/database'

interface KanbanBoardProps {
  stages: CrmPipelineStage[]
  deals: CrmDealWithRelations[]
  onDealMove: (dealId: string, newStageId: string, newPosition: number) => void
}

export function KanbanBoard({ stages, deals, onDealMove }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localDeals, setLocalDeals] = useState(deals)

  // Update local deals when props change
  if (deals !== localDeals && !activeId) {
    setLocalDeals(deals)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const activeDeal = localDeals.find((d) => d.id === activeId)

  const getDealsByStage = useCallback(
    (stageId: string) =>
      localDeals
        .filter((d) => d.stage_id === stageId)
        .sort((a, b) => a.position - b.position),
    [localDeals]
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeDeal = localDeals.find((d) => d.id === activeId)
    if (!activeDeal) return

    // Check if over a stage (column) or a deal (card)
    const overStage = stages.find((s) => s.id === overId)
    const overDeal = localDeals.find((d) => d.id === overId)

    const newStageId = overStage?.id ?? overDeal?.stage_id
    if (!newStageId || activeDeal.stage_id === newStageId) return

    // Move deal to new stage
    setLocalDeals((prev) =>
      prev.map((d) =>
        d.id === activeId ? { ...d, stage_id: newStageId } : d
      )
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const deal = localDeals.find((d) => d.id === activeId)
    if (!deal) return

    // Determine target stage
    const overStage = stages.find((s) => s.id === overId)
    const overDeal = localDeals.find((d) => d.id === overId)
    const targetStageId = overStage?.id ?? overDeal?.stage_id ?? deal.stage_id

    // Reorder within stage
    const stageDeals = localDeals
      .filter((d) => d.stage_id === targetStageId)
      .sort((a, b) => a.position - b.position)

    const oldIndex = stageDeals.findIndex((d) => d.id === activeId)
    const newIndex = overDeal
      ? stageDeals.findIndex((d) => d.id === overId)
      : stageDeals.length

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const reordered = arrayMove(stageDeals, oldIndex, newIndex)
      setLocalDeals((prev) => {
        const other = prev.filter((d) => d.stage_id !== targetStageId || d.id === activeId)
        const updated = reordered.map((d, i) => ({ ...d, position: i }))
        return [...other.filter((d) => d.id !== activeId), ...updated]
      })
    }

    // Notify parent
    const position = newIndex !== -1 ? newIndex : stageDeals.length
    onDealMove(activeId, targetStageId, position)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages
          .filter((s) => !s.is_won && !s.is_lost)
          .map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={getDealsByStage(stage.id)}
            />
          ))}
      </div>

      {/* Won/Lost columns in a separate section */}
      <div className="mt-6 border-t pt-4">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Fechados</h3>
        <div className="flex gap-4">
          {stages
            .filter((s) => s.is_won || s.is_lost)
            .map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                deals={getDealsByStage(stage.id)}
              />
            ))}
        </div>
      </div>

      <DragOverlay>
        {activeDeal && <DealCard deal={activeDeal} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
