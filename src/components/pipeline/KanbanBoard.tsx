'use client'

import { useState, useCallback, useEffect } from 'react'
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
import type { CrmPipelineStage, CrmDealWithRelations, CrmDealPriority } from '@/types/database'

const PRIORITY_ORDER: Record<CrmDealPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

interface KanbanBoardProps {
  stages: CrmPipelineStage[]
  deals: CrmDealWithRelations[]
  onDealMove: (dealId: string, newStageId: string, newPosition: number) => void
  sortBy?: 'created_at' | 'value' | 'priority'
}

export function KanbanBoard({ stages, deals, onDealMove, sortBy }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localDeals, setLocalDeals] = useState(deals)

  // Sync parent deals into local state only when not dragging
  useEffect(() => {
    if (!activeId) setLocalDeals(deals)
  }, [deals, activeId])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const activeDeal = localDeals.find((d) => d.id === activeId)

  const getDealsByStage = useCallback(
    (stageId: string) => {
      const stageDeals = localDeals.filter((d) => d.stage_id === stageId)

      if (sortBy === 'created_at') {
        return stageDeals.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }
      if (sortBy === 'value') {
        return stageDeals.sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
      }
      if (sortBy === 'priority') {
        return stageDeals.sort((a, b) => {
          // Lead Prime sempre primeiro
          const aIsPrime = a.tags?.includes('lead_prime') ? 0 : 1
          const bIsPrime = b.tags?.includes('lead_prime') ? 0 : 1
          if (aIsPrime !== bIsPrime) return aIsPrime - bIsPrime
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        })
      }

      // Default: position ascending (current behavior)
      return stageDeals.sort((a, b) => a.position - b.position)
    },
    [localDeals, sortBy]
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

  const activeStages = stages.filter((s) => !s.is_won && !s.is_lost)
  const closedStages = stages.filter((s) => s.is_won || s.is_lost)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {activeStages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            deals={getDealsByStage(stage.id)}
          />
        ))}

        {/* Divider before Won/Lost columns */}
        {closedStages.length > 0 && (
          <div className="flex-shrink-0 w-px bg-border self-stretch mx-1" />
        )}

        {closedStages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            deals={getDealsByStage(stage.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal && <DealCard deal={activeDeal} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
