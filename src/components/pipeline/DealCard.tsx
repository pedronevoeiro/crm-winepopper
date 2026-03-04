'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatBRL, daysAgo, PRODUCT_INTEREST_LABELS } from '@/lib/constants'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import {
  Building2, Clock, CheckSquare, Star,
  Phone, MessageCircle, Bot, BotOff,
  ChevronDown, ChevronUp,
  Calendar, RotateCw, Mail, MoreHorizontal,
} from 'lucide-react'
import type { CrmDealWithRelations, CrmTask } from '@/types/database'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface DealCardProps {
  deal: CrmDealWithRelations
  isDragging?: boolean
}

const TASK_ICONS: Record<CrmTask['type'], React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  follow_up: RotateCw,
  other: MoreHorizontal,
}

function stopDrag(e: React.PointerEvent) {
  e.stopPropagation()
}

export function DealCard({ deal, isDragging }: DealCardProps) {
  const [showTasks, setShowTasks] = useState(false)

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

  const daysInStage   = daysAgo(deal.stage_entered_at)
  const isLeadPrime   = deal.tags?.includes('lead_prime')
  const pendingTasks  = deal.next_task?.filter((t) => t.status === 'pending') ?? []
  const hasOverdue    = pendingTasks.some((t) => t.due_date && new Date(t.due_date) < new Date())
  const isAIHandling  = !!deal.whatsapp_outreach_at && !deal.ai_disabled_at
  const needsHuman    = !!deal.ai_disabled_at

  const phone    = deal.contact?.phone ?? deal.contact?.mobile ?? null
  const waNumber = deal.contact?.mobile
    ? `55${deal.contact.mobile.replace(/\D/g, '')}`
    : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow active:cursor-grabbing ${
        isLeadPrime ? 'border-amber-400 ring-1 ring-amber-300' : ''
      }`}
    >
      {/* Title + badges */}
      <Link href={`/negocios/${deal.id}`} className="block" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-medium leading-tight">{deal.title}</h4>
          <div className="flex items-center gap-1 shrink-0">
            {isLeadPrime && (
              <span
                className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-300"
                title="Lead Prime: alto valor + urgência"
              >
                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                PRIME
              </span>
            )}
            <PriorityBadge priority={deal.priority} />
          </div>
        </div>
      </Link>

      {/* Contact + call/WA buttons */}
      {deal.contact && (
        <div className="flex items-center justify-between gap-1 mb-1">
          <Link
            href={`/negocios/${deal.id}`}
            className="text-xs font-medium truncate hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {deal.contact.name}
          </Link>
          <div className="flex items-center gap-0.5 shrink-0" onPointerDown={stopDrag}>
            {phone && (
              <a
                href={`tel:${phone}`}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title={`Ligar: ${phone}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="h-3 w-3" />
              </a>
            )}
            {waNumber && (
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-green-600 transition-colors"
                title="Enviar WhatsApp"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Company */}
      {deal.company && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{deal.company.trade_name ?? deal.company.name}</span>
        </div>
      )}

      {/* Product interest */}
      {deal.product_interest && (
        <div className="text-xs text-muted-foreground mb-1">
          {PRODUCT_INTEREST_LABELS[deal.product_interest]}
          {deal.expected_quantity ? ` · ${deal.expected_quantity} un.` : ''}
        </div>
      )}

      {/* Bottom row: value | AI badge | tasks | days */}
      <div className="flex items-center justify-between pt-1 mt-1 border-t border-border/50">
        {deal.value ? (
          <span className="text-sm font-semibold text-green-700">
            {formatBRL(deal.value)}
          </span>
        ) : deal.estimated_value ? (
          <span className="text-xs text-muted-foreground" title="Valor estimado">
            ~{formatBRL(deal.estimated_value / 100)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Sem valor</span>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {isAIHandling && (
            <span
              className="flex items-center gap-0.5 rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[10px] font-medium"
              title="IA Julia em contato"
            >
              <Bot className="h-2.5 w-2.5" /> IA
            </span>
          )}
          {needsHuman && (
            <span
              className="flex items-center gap-0.5 rounded-full bg-orange-100 text-orange-700 px-1.5 py-0.5 text-[10px] font-medium"
              title="Ação humana necessária"
            >
              <BotOff className="h-2.5 w-2.5" /> humano
            </span>
          )}

          {pendingTasks.length > 0 && (
            <button
              type="button"
              className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                hasOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}
              title={`${pendingTasks.length} tarefa(s) pendente(s)`}
              onPointerDown={stopDrag}
              onClick={(e) => { e.stopPropagation(); setShowTasks((p) => !p) }}
            >
              <CheckSquare className="h-2.5 w-2.5" />
              {pendingTasks.length}
              {showTasks ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
            </button>
          )}

          <span className="flex items-center gap-0.5" title={`${daysInStage} dias neste estágio`}>
            <Clock className="h-3 w-3" />{daysInStage}d
          </span>
        </div>
      </div>

      {/* Owner */}
      {deal.owner && (
        <div className="text-xs text-muted-foreground mt-1">
          Resp: {deal.owner.display_name}
        </div>
      )}

      {/* Tasks dropdown */}
      {showTasks && pendingTasks.length > 0 && (
        <div className="mt-2 border-t border-border/50 pt-2 space-y-1" onPointerDown={stopDrag}>
          {pendingTasks.map((task) => {
            const Icon = TASK_ICONS[task.type] ?? MoreHorizontal
            const overdue = task.due_date && new Date(task.due_date) < new Date()
            return (
              <div
                key={task.id}
                className={`flex items-start gap-1.5 text-xs rounded px-1 py-0.5 ${
                  overdue ? 'bg-red-50 text-red-700' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-3 w-3 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{task.title}</div>
                  {task.due_date && (
                    <div className="text-[10px] opacity-70">
                      {new Date(task.due_date).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
