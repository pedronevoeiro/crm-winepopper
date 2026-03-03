'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DealCard } from './DealCard'
import { Badge } from '@/components/ui/badge'
import { formatBRL } from '@/lib/constants'
import type { CrmPipelineStage, CrmDealWithRelations } from '@/types/database'

interface KanbanColumnProps {
  stage: CrmPipelineStage
  deals: CrmDealWithRelations[]
}

export function KanbanColumn({ stage, deals }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  const totalValue = deals.reduce((sum, d) => sum + (d.value ?? 0), 0)
  const dealIds = deals.map((d) => d.id)

  return (
    <div className="flex w-72 shrink-0 flex-col">
      {/* Header */}
      <div className="mb-2 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`${stage.color ?? 'bg-gray-100 text-gray-800'} border-0`}>
              {stage.name}
            </Badge>
            <span className="text-sm text-muted-foreground">{deals.length}</span>
          </div>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-muted-foreground">{formatBRL(totalValue)}</p>
        )}
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 rounded-lg border-2 border-dashed p-2 transition-colors ${
          isOver ? 'border-primary bg-primary/5' : 'border-transparent'
        }`}
      >
        <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
            Arraste um negócio aqui
          </div>
        )}
      </div>
    </div>
  )
}
