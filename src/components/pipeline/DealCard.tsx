'use client'

import Link from 'next/link'
import { formatBRL, daysAgo, PRODUCT_INTEREST_LABELS } from '@/lib/constants'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { Building2, User, Clock, CheckSquare } from 'lucide-react'
import type { CrmDealWithRelations } from '@/types/database'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface DealCardProps {
  deal: CrmDealWithRelations
  isDragging?: boolean
}

export function DealCard({ deal, isDragging }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const daysInStage = daysAgo(deal.stage_entered_at)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow active:cursor-grabbing"
    >
      <Link href={`/negocios/${deal.id}`} className="block" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium leading-tight">{deal.title}</h4>
            <PriorityBadge priority={deal.priority} />
          </div>

          {deal.company && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              {deal.company.trade_name ?? deal.company.name}
            </div>
          )}

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            {deal.contact?.name}
          </div>

          {deal.product_interest && (
            <div className="text-xs text-muted-foreground">
              {PRODUCT_INTEREST_LABELS[deal.product_interest]}
              {deal.expected_quantity ? ` · ${deal.expected_quantity} un.` : ''}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {deal.value ? (
              <span className="text-sm font-semibold text-green-700">
                {formatBRL(deal.value)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Sem valor</span>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {deal.next_task && (
                <span className="flex items-center gap-0.5 text-amber-600" title={deal.next_task.title}>
                  <CheckSquare className="h-3 w-3" />
                </span>
              )}
              <span className="flex items-center gap-0.5" title={`${daysInStage} dias neste estágio`}>
                <Clock className="h-3 w-3" />{daysInStage}d
              </span>
            </div>
          </div>

          {deal.owner && (
            <div className="text-xs text-muted-foreground">
              Resp: {deal.owner.display_name}
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}
