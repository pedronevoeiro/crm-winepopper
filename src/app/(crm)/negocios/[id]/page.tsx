'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ActivityTimeline } from '@/components/shared/ActivityTimeline'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  formatBRL, formatDate, formatDateTime, formatCNPJ, daysAgo,
  PRODUCT_INTEREST_LABELS, LEAD_SOURCE_LABELS,
  TASK_STATUS_LABELS, TASK_TYPE_LABELS, TASK_STATUS_COLORS,
} from '@/lib/constants'
import {
  Building2, User, Calendar, CheckSquare, Plus, Phone, Mail,
  RotateCw, MoreHorizontal, Circle, CheckCircle2, Clock,
  Package, Truck, MessageCircle, ChevronDown, ChevronUp,
  Pencil, Save, X, Trash2, Bot, UserCircle, Star, BotOff, MessageSquare,
} from 'lucide-react'
import type {
  CrmDeal, CrmPipelineStage, CrmCompany, CrmContact,
  CrmActivity, CrmTask, CrmDealItem, ChatConversation,
  CrmUserProfile, CrmActivityWithUser, CrmTaskType, CrmFunnel,
} from '@/types/database'

// ─── Types ──────────────────────────────────────────────────────────────────

interface DealDetail extends CrmDeal {
  stage: CrmPipelineStage
  funnel: CrmFunnel | null
  company: CrmCompany | null
  contact: CrmContact
  owner: CrmUserProfile | null
  activities: CrmActivity[]
  tasks: CrmTask[]
  deal_items: CrmDealItem[]
  chat_conversations: ChatConversation[]
}

interface ShippingQuote {
  carrier: string
  price: number
  delivery_days: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

const URGENCY_LABELS: Record<string, string> = {
  'ate-10-dias': 'Até 10 dias',
  'ate-15-dias': 'Até 15 dias',
  '15-a-30-dias': '15 a 30 dias',
  '30-a-60-dias': '30 a 60 dias',
  '60-a-90-dias': '60 a 90 dias',
}

const BUDGET_LABELS: Record<string, string> = {
  '30-a-75': 'R$30 a R$75',
  '75-a-100': 'R$75 a R$100',
  '100-a-150': 'R$100 a R$150',
  '150-a-200': 'R$150 a R$200',
  '200-a-300': 'R$200 a R$300',
  'acima-de-300': 'Acima de R$300',
}

const TASK_TYPE_ICON_MAP: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  follow_up: RotateCw,
  other: MoreHorizontal,
}

const PRODUCTS_CATALOG = [
  { id: 'classico', name: 'Classico', price: 190 },
  { id: 'lite_plus', name: 'Lite Plus', price: 135 },
  { id: 'lite', name: 'Lite', price: 90 },
] as const

// ─── Page Component ─────────────────────────────────────────────────────────

export default function NegocioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [deal, setDeal] = useState<DealDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Activity form
  const [activityContent, setActivityContent] = useState('')
  const [activityType, setActivityType] = useState('note')

  const refreshDeal = useCallback(async () => {
    try {
      const res = await fetch(`/api/deals/${id}`)
      if (res.ok) {
        const data = await res.json()
        setDeal(data)
      }
    } catch (err) {
      console.error('Failed to refresh deal:', err)
    }
  }, [id])

  useEffect(() => {
    fetch(`/api/deals/${id}`)
      .then((res) => res.json())
      .then(setDeal)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  async function addActivity() {
    if (!activityContent.trim() || !deal) return
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: deal.id,
          contact_id: deal.contact_id,
          company_id: deal.company_id,
          user_id: deal.owner?.id ?? null,
          type: activityType,
          content: activityContent,
        }),
      })
      setActivityContent('')
      await refreshDeal()
    } catch (err) {
      console.error('Failed to add activity:', err)
    }
  }

  async function deleteDeal() {
    if (!deal) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/deals/${deal.id}`, { method: 'DELETE' })
      if (res.ok) router.push('/pipeline')
    } catch (err) {
      console.error('Failed to delete deal:', err)
    } finally {
      setDeleting(false)
    }
  }

  // ─── Loading / Not Found ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!deal) {
    return <div className="text-muted-foreground">Negocio nao encontrado</div>
  }

  // ─── Derived Data ──────────────────────────────────────────────────────────

  const activitiesWithUser: CrmActivityWithUser[] = (deal.activities ?? []).map((a) => ({
    ...a,
    user: a.user_id === deal.owner?.id ? deal.owner : null,
  }))

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title={deal.title}
        description={`${deal.funnel?.name ?? 'Funil'} · ${deal.stage.name}`}
        actions={
          <div className="flex items-center gap-2">
            {deal.tags?.includes('lead_prime') && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-300">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                PRIME
              </span>
            )}
            {deal.owner && (
              <span className="text-sm text-muted-foreground">
                Responsavel: {deal.owner.display_name}
              </span>
            )}
            <Badge variant="secondary" className={`${deal.stage.color} border-0`}>
              {deal.stage.name}
            </Badge>
            <PriorityBadge priority={deal.priority} />
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-destructive font-medium">Confirmar exclusão?</span>
                <Button size="sm" variant="destructive" onClick={deleteDeal} disabled={deleting}>
                  {deleting ? 'Apagando...' : 'Apagar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* ══════════ MAIN COLUMN (col-span-2) ══════════ */}
        <div className="space-y-6 md:col-span-2">

          {/* 1. TASKS CARD — First in main column */}
          <TasksCard deal={deal} onRefresh={refreshDeal} />

          {/* 8. CHAT HISTORY — Above activity timeline */}
          {(deal.chat_conversations ?? []).length > 0 && (
            <ChatHistoryCard conversations={deal.chat_conversations} />
          )}

          {/* Add Activity */}
          <Card>
            <CardHeader><CardTitle>Adicionar Atividade</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Nota</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="call">Ligacao</SelectItem>
                    <SelectItem value="meeting">Reuniao</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={activityContent}
                  onChange={(e) => setActivityContent(e.target.value)}
                  placeholder="Descreva a atividade..."
                  onKeyDown={(e) => e.key === 'Enter' && addActivity()}
                />
                <Button onClick={addActivity} disabled={!activityContent.trim()}>
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader><CardTitle>Historico</CardTitle></CardHeader>
            <CardContent>
              <ActivityTimeline activities={activitiesWithUser} />
            </CardContent>
          </Card>
        </div>

        {/* ══════════ SIDEBAR ══════════ */}
        <div className="space-y-6">

          {/* Fechar Negócio */}
          <CloseWonLostCard deal={deal} onRefresh={refreshDeal} />

          {/* Details */}
          <Card>
            <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {deal.value != null ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-semibold text-green-700">{formatBRL(deal.value)}</span>
                </div>
              ) : deal.estimated_value ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor estimado</span>
                  <span className="text-muted-foreground">~{formatBRL(deal.estimated_value / 100)}</span>
                </div>
              ) : null}
              {deal.funnel && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Funil</span>
                  <span>{deal.funnel.name}</span>
                </div>
              )}
              {deal.product_interest && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produto</span>
                  <span>{PRODUCT_INTEREST_LABELS[deal.product_interest]}</span>
                </div>
              )}
              {deal.urgency && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prazo desejado</span>
                  <span>{URGENCY_LABELS[deal.urgency] ?? deal.urgency}</span>
                </div>
              )}
              {deal.expected_quantity && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Qtd. brindes</span>
                  <span>{deal.expected_quantity} un.</span>
                </div>
              )}
              {deal.budget_range && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor unitário</span>
                  <span>{BUDGET_LABELS[deal.budget_range] ?? deal.budget_range}</span>
                </div>
              )}
              {deal.expected_close_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Previsao</span>
                  <span>{formatDate(deal.expected_close_date)}</span>
                </div>
              )}
              {deal.source && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fonte</span>
                  <span>{LEAD_SOURCE_LABELS[deal.source]}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dias no estagio</span>
                <span>{daysAgo(deal.stage_entered_at)} dias</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{formatDate(deal.created_at)}</span>
              </div>
              {deal.first_interaction_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">1ª interação</span>
                  <span>{formatDate(deal.first_interaction_at)}</span>
                </div>
              )}
              {deal.whatsapp_outreach_at && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />WhatsApp enviado
                  </span>
                  <span>{formatDate(deal.whatsapp_outreach_at)}</span>
                </div>
              )}
              {deal.ai_disabled_at && (
                <div className="flex items-center gap-1.5 rounded-md bg-orange-50 px-2 py-1.5 text-xs text-orange-700">
                  <BotOff className="h-3.5 w-3.5" />
                  IA desativada — atendimento humano
                </div>
              )}
              {deal.lost_reason && (
                <div className="rounded-md bg-red-50 p-2 text-sm text-red-800">
                  <strong>Motivo da perda:</strong> {deal.lost_reason}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company — Editable Inline (always shown) */}
          <CompanyCard company={deal.company} dealId={deal.id} dealTitle={deal.title} onRefresh={refreshDeal} />

          {/* Contact + Quick Add */}
          <ContactCard deal={deal} onRefresh={refreshDeal} />

          {/* Logo & Mockup from checkout */}
          <LogoMockupCard activities={deal.activities ?? []} />

          {/* 4. Products & Quantities */}
          <ProductsCard deal={deal} onRefresh={refreshDeal} />

          {/* 7. Freight Calculator */}
          <FreightCard deal={deal} />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// FECHAR NEGÓCIO (Ganho / Perdido)
// ═══════════════════════════════════════════════════════════════════════════════

const LOST_REASONS = [
  { value: 'preco_alto',         label: 'Preço fora do orçamento' },
  { value: 'concorrencia',       label: 'Comprou da concorrência' },
  { value: 'sem_interesse',      label: 'Sem interesse no momento' },
  { value: 'sem_resposta',       label: 'Sem resposta' },
  { value: 'prazo_incompativel', label: 'Prazo incompatível' },
  { value: 'nao_atendemos',      label: 'Não conseguimos atender' },
  { value: 'outro',              label: 'Outro motivo...' },
]

function CloseWonLostCard({ deal, onRefresh }: { deal: DealDetail; onRefresh: () => Promise<void> }) {
  const [mode, setMode] = useState<null | 'won' | 'lost'>(null)
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [saving, setSaving] = useState(false)

  // Não mostrar se já estiver ganho ou perdido
  if (deal.stage.is_won || deal.stage.is_lost) return null

  async function confirm() {
    setSaving(true)
    try {
      const funnelsRes = await fetch('/api/funnels')
      const funnels: Array<{ id: string; slug: string }> = await funnelsRes.json()
      const finalizadosFunnel = funnels.find((f) => f.slug === 'funil-b2b-site')
      if (!finalizadosFunnel) throw new Error('Funil Finalizados não encontrado')

      const stagesRes = await fetch(`/api/pipeline-stages?funnel_id=${finalizadosFunnel.id}`)
      const stages: Array<{ id: string; is_won: boolean; is_lost: boolean }> = await stagesRes.json()
      const targetStage = stages.find((s) => (mode === 'won' ? s.is_won : s.is_lost))
      if (!targetStage) throw new Error('Estágio não encontrado')

      const finalReason = reason === 'outro' ? customReason : LOST_REASONS.find((r) => r.value === reason)?.label ?? reason

      await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_id: targetStage.id,
          funnel_id: finalizadosFunnel.id,
          ...(mode === 'lost' && finalReason ? { lost_reason: finalReason } : {}),
        }),
      })
      await onRefresh()
      setMode(null)
      setReason('')
      setCustomReason('')
    } catch (err) {
      console.error('Failed to close deal:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Fechar Negócio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!mode ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setMode('won')}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Ganho
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setMode('lost')}
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Perdido
            </Button>
          </div>
        ) : mode === 'won' ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Confirmar como negócio ganho?</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={confirm}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Confirmar Ganho'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMode(null)} disabled={saving}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Motivo da perda..." />
              </SelectTrigger>
              <SelectContent>
                {LOST_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reason === 'outro' && (
              <Input
                placeholder="Descreva o motivo..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="h-8 text-sm"
              />
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={confirm}
                disabled={saving || !reason || (reason === 'outro' && !customReason.trim())}
              >
                {saving ? 'Salvando...' : 'Confirmar Perda'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setMode(null); setReason('') }} disabled={saving}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1 + 2 + 3. TASKS CARD
// ═══════════════════════════════════════════════════════════════════════════════

function TasksCard({ deal, onRefresh }: { deal: DealDetail; onRefresh: () => Promise<void> }) {
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null)
  const [quickTaskType, setQuickTaskType] = useState<CrmTaskType>('follow_up')
  const [quickTaskTitle, setQuickTaskTitle] = useState(`Follow-up: ${deal.title}`)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [creatingQuick, setCreatingQuick] = useState(false)

  // Inline create form state
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<CrmTaskType>('follow_up')
  const [newDueDate, setNewDueDate] = useState('')
  const [creatingNew, setCreatingNew] = useState(false)

  // Sort: pending first by due_date asc, then completed
  const sortedTasks = [...deal.tasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (a.status !== 'completed' && b.status === 'completed') return -1
    if (a.status !== 'completed' && b.status !== 'completed') {
      const da = a.due_date ? new Date(a.due_date).getTime() : Infinity
      const db = b.due_date ? new Date(b.due_date).getTime() : Infinity
      return da - db
    }
    return 0
  })

  async function completeTask(taskId: string) {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      setJustCompletedId(taskId)
      setQuickTaskTitle(`Follow-up: ${deal.title}`)
      setQuickTaskType('follow_up')
      setShowDatePicker(false)
      setCustomDate('')
      await onRefresh()
    } catch (err) {
      console.error('Failed to complete task:', err)
    }
  }

  async function createQuickTask(dueDate: string) {
    if (creatingQuick) return
    setCreatingQuick(true)
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickTaskTitle,
          type: quickTaskType,
          deal_id: deal.id,
          contact_id: deal.contact_id,
          assigned_to: deal.owner_id,
          due_date: dueDate,
          status: 'pending',
          priority: 'medium',
        }),
      })
      setJustCompletedId(null)
      await onRefresh()
    } catch (err) {
      console.error('Failed to create quick task:', err)
    } finally {
      setCreatingQuick(false)
    }
  }

  async function createInlineTask() {
    if (!newTitle.trim() || creatingNew) return
    setCreatingNew(true)
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          type: newType,
          deal_id: deal.id,
          contact_id: deal.contact_id,
          assigned_to: deal.owner_id,
          due_date: newDueDate || null,
          status: 'pending',
          priority: 'medium',
        }),
      })
      setNewTitle('')
      setNewDueDate('')
      await onRefresh()
    } catch (err) {
      console.error('Failed to create task:', err)
    } finally {
      setCreatingNew(false)
    }
  }

  function getQuickDate(preset: string): string {
    const now = new Date()
    switch (preset) {
      case '1h': {
        const d = new Date(now.getTime() + 60 * 60 * 1000)
        return d.toISOString()
      }
      case '3h': {
        const d = new Date(now.getTime() + 3 * 60 * 60 * 1000)
        return d.toISOString()
      }
      case 'amanha9': {
        const d = new Date(now)
        d.setDate(d.getDate() + 1)
        d.setHours(9, 0, 0, 0)
        return d.toISOString()
      }
      case 'amanha14': {
        const d = new Date(now)
        d.setDate(d.getDate() + 1)
        d.setHours(14, 0, 0, 0)
        return d.toISOString()
      }
      default:
        return now.toISOString()
    }
  }

  function isDueDateOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Tarefas
          {deal.tasks.filter((t) => t.status === 'pending').length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {deal.tasks.filter((t) => t.status === 'pending').length} pendente{deal.tasks.filter((t) => t.status === 'pending').length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedTasks.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">Nenhuma tarefa cadastrada.</p>
        )}

        {sortedTasks.map((task) => {
          const Icon = TASK_TYPE_ICON_MAP[task.type] ?? MoreHorizontal
          const isCompleted = task.status === 'completed'
          const isOverdue = !isCompleted && isDueDateOverdue(task.due_date)

          return (
            <div key={task.id}>
              <div
                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                  isCompleted ? 'bg-muted/40' : isOverdue ? 'border-red-200 bg-red-50/50' : 'hover:bg-accent/30'
                }`}
              >
                {/* Checkbox circle */}
                <button
                  onClick={() => !isCompleted && completeTask(task.id)}
                  disabled={isCompleted}
                  className={`mt-0.5 flex-shrink-0 transition-colors ${
                    isCompleted
                      ? 'text-green-500 cursor-default'
                      : 'text-muted-foreground hover:text-green-500 cursor-pointer'
                  }`}
                  title={isCompleted ? 'Concluida' : 'Marcar como concluida'}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>

                {/* Task type icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <Icon className={`h-4 w-4 ${isCompleted ? 'text-muted-foreground' : 'text-primary'}`} />
                </div>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {TASK_TYPE_LABELS[task.type]}
                    </span>
                    {task.due_date && (
                      <span className={`text-xs flex items-center gap-1 ${
                        isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                      }`}>
                        <Clock className="h-3 w-3" />
                        {formatDate(task.due_date)}
                        {isOverdue && ' (atrasada)'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <Badge variant="secondary" className={`text-xs flex-shrink-0 ${TASK_STATUS_COLORS[task.status]} border-0`}>
                  {TASK_STATUS_LABELS[task.status]}
                </Badge>
              </div>

              {/* 2. Quick Next Task — shown after completing */}
              {justCompletedId === task.id && (
                <div className="ml-8 mt-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 space-y-3">
                  <p className="text-sm font-medium text-primary">Agendar proxima tarefa:</p>

                  {/* Title + Type */}
                  <div className="flex gap-2">
                    <Input
                      value={quickTaskTitle}
                      onChange={(e) => setQuickTaskTitle(e.target.value)}
                      placeholder="Titulo da tarefa"
                      className="text-sm h-8"
                    />
                    <Select value={quickTaskType} onValueChange={(v) => setQuickTaskType(v as CrmTaskType)}>
                      <SelectTrigger className="w-32 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Ligacao</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="meeting">Reuniao</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quick time buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => createQuickTask(getQuickDate('1h'))}
                      disabled={creatingQuick}
                    >
                      1h
                    </Button>
                    <Button
                      size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => createQuickTask(getQuickDate('3h'))}
                      disabled={creatingQuick}
                    >
                      3h
                    </Button>
                    <Button
                      size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => createQuickTask(getQuickDate('amanha9'))}
                      disabled={creatingQuick}
                    >
                      Amanha 9h
                    </Button>
                    <Button
                      size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => createQuickTask(getQuickDate('amanha14'))}
                      disabled={creatingQuick}
                    >
                      Amanha 14h
                    </Button>
                    <Button
                      size="sm" variant={showDatePicker ? 'default' : 'outline'}
                      className="h-7 text-xs"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                    >
                      Escolher data
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
                      onClick={() => setJustCompletedId(null)}
                    >
                      Pular
                    </Button>
                  </div>

                  {/* Custom date picker */}
                  {showDatePicker && (
                    <div className="flex gap-2 items-center">
                      <Input
                        type="datetime-local"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="h-8 text-sm w-auto"
                      />
                      <Button
                        size="sm" className="h-8"
                        disabled={!customDate || creatingQuick}
                        onClick={() => customDate && createQuickTask(new Date(customDate).toISOString())}
                      >
                        Criar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* 3. Inline Create Task Form */}
        <Separator className="my-3" />
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Nova tarefa..."
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && createInlineTask()}
          />
          <Select value={newType} onValueChange={(v) => setNewType(v as CrmTaskType)}>
            <SelectTrigger className="w-28 h-8 text-sm flex-shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Ligacao</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="meeting">Reuniao</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="h-8 text-sm w-36 flex-shrink-0"
          />
          <Button
            size="sm" className="h-8 flex-shrink-0"
            onClick={createInlineTask}
            disabled={!newTitle.trim() || creatingNew}
          >
            Criar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PRODUCTS & QUANTITIES
// ═══════════════════════════════════════════════════════════════════════════════

function ProductsCard({ deal, onRefresh }: { deal: DealDetail; onRefresh: () => Promise<void> }) {
  const [showAdd, setShowAdd] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS_CATALOG[0].id)
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(PRODUCTS_CATALOG[0].price)
  const [adding, setAdding] = useState(false)

  const totalValue = deal.deal_items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)

  function handleProductChange(productId: string) {
    setSelectedProduct(productId)
    const product = PRODUCTS_CATALOG.find((p) => p.id === productId)
    if (product) setUnitPrice(product.price)
  }

  async function addItem() {
    if (adding) return
    setAdding(true)
    const product = PRODUCTS_CATALOG.find((p) => p.id === selectedProduct)!
    try {
      await fetch('/api/deal-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: deal.id,
          product_id: product.id,
          product_name: product.name,
          quantity,
          unit_price: unitPrice,
        }),
      })
      setShowAdd(false)
      setQuantity(1)
      setUnitPrice(PRODUCTS_CATALOG[0].price)
      await onRefresh()
    } catch (err) {
      console.error('Failed to add deal item:', err)
    } finally {
      setAdding(false)
    }
  }

  async function removeItem(itemId: string) {
    try {
      await fetch(`/api/deal-items/${itemId}`, { method: 'DELETE' })
      await onRefresh()
    } catch (err) {
      console.error('Failed to remove deal item:', err)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          Produtos
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {deal.deal_items.length === 0 && !showAdd && (
          <p className="text-sm text-muted-foreground">Nenhum produto adicionado.</p>
        )}

        {deal.deal_items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
            <div className="flex-1 min-w-0">
              <div className="font-medium">{item.product_name}</div>
              <div className="text-xs text-muted-foreground">
                {item.quantity} x {formatBRL(item.unit_price)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-green-700">
                {formatBRL(item.quantity * item.unit_price)}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-muted-foreground hover:text-red-500 transition-colors"
                title="Remover item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {/* Add item form */}
        {showAdd && (
          <div className="rounded-md border border-dashed p-3 space-y-2">
            <Select value={selectedProduct} onValueChange={handleProductChange}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCTS_CATALOG.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 w-20">
                <span className="text-xs text-muted-foreground">Qtd</span>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-xs text-muted-foreground">Preço unit. (R$)</span>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Total: {formatBRL(quantity * unitPrice)}
              </span>
              <div className="flex gap-2">
                <Button size="sm" className="h-8" onClick={addItem} disabled={adding}>
                  Adicionar
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowAdd(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Total */}
        {deal.deal_items.length > 0 && (
          <>
            <Separator />
            <div className="flex justify-between font-medium text-sm pt-1">
              <span>Total</span>
              <span className="text-green-700">{formatBRL(totalValue)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. COMPANY CARD — Editable Inline (shows even when no company linked)
// ═══════════════════════════════════════════════════════════════════════════════

const EMPTY_COMPANY_FORM = {
  name: '', trade_name: '', cnpj: '', cep: '', street: '', number: '',
  complement: '', neighborhood: '', city: '', state: '', industry: '', email: '', phone: '',
}

function extractCompanyName(dealTitle: string): string {
  return dealTitle.replace(/ - LP B2B.*$/, '').replace(/ - LP B2B$/, '').trim()
}

async function fetchCep(digits: string): Promise<Partial<typeof EMPTY_COMPANY_FORM> | null> {
  if (digits.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    const data = await res.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string }
    if (data.erro) return null
    return {
      street: data.logradouro ?? '',
      neighborhood: data.bairro ?? '',
      city: data.localidade ?? '',
      state: data.uf ?? '',
    }
  } catch { return null }
}

function CompanyCard({ company, dealId, dealTitle, onRefresh }: { company: CrmCompany | null; dealId: string; dealTitle: string; onRefresh: () => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const defaultName = !company ? extractCompanyName(dealTitle) : ''
  const [form, setForm] = useState(company ? {
    name: company.name,
    trade_name: company.trade_name ?? '',
    cnpj: company.cnpj ?? '',
    cep: company.cep ?? '',
    street: company.street ?? '',
    number: company.number ?? '',
    complement: company.complement ?? '',
    neighborhood: company.neighborhood ?? '',
    city: company.city ?? '',
    state: company.state ?? '',
    industry: company.industry ?? '',
    email: company.email ?? '',
    phone: company.phone ?? '',
  } : { ...EMPTY_COMPANY_FORM, name: defaultName })

  async function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'cep') {
      const digits = value.replace(/\D/g, '')
      if (digits.length === 8) {
        const addr = await fetchCep(digits)
        if (addr) setForm((prev) => ({ ...prev, ...addr }))
      }
    }
  }

  async function saveCompany() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (company) {
        // Update existing company
        await fetch(`/api/companies/${company.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            trade_name: form.trade_name || null,
            cnpj: form.cnpj || null,
            cep: form.cep || null,
            street: form.street || null,
            number: form.number || null,
            complement: form.complement || null,
            neighborhood: form.neighborhood || null,
            city: form.city || null,
            state: form.state || null,
            industry: form.industry || null,
            email: form.email || null,
            phone: form.phone || null,
          }),
        })
      } else {
        // Create new company and link to deal
        const res = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            trade_name: form.trade_name || null,
            cnpj: form.cnpj || null,
            cep: form.cep || null,
            street: form.street || null,
            number: form.number || null,
            complement: form.complement || null,
            neighborhood: form.neighborhood || null,
            city: form.city || null,
            state: form.state || null,
            industry: form.industry || null,
            email: form.email || null,
            phone: form.phone || null,
          }),
        })
        if (res.ok) {
          const newCompany = await res.json()
          await fetch(`/api/deals/${dealId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id: newCompany.id }),
          })
        }
      }
      setEditing(false)
      await onRefresh()
    } catch (err) {
      console.error('Failed to save company:', err)
    } finally {
      setSaving(false)
    }
  }

  function cancelEdit() {
    setForm(company ? {
      name: company.name,
      trade_name: company.trade_name ?? '',
      cnpj: company.cnpj ?? '',
      cep: company.cep ?? '',
      street: company.street ?? '',
      number: company.number ?? '',
      complement: company.complement ?? '',
      neighborhood: company.neighborhood ?? '',
      city: company.city ?? '',
      state: company.state ?? '',
      industry: company.industry ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
    } : { ...EMPTY_COMPANY_FORM, name: defaultName })
    setEditing(false)
  }

  const EditForm = (
    <CardContent className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground">Razao Social *</label>
          <Input className="h-7 text-sm" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Nome da empresa" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Nome Fantasia</label>
          <Input className="h-7 text-sm" value={form.trade_name} onChange={(e) => updateField('trade_name', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">CNPJ</label>
          <Input className="h-7 text-sm" value={form.cnpj} onChange={(e) => updateField('cnpj', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Setor</label>
          <Input className="h-7 text-sm" value={form.industry} onChange={(e) => updateField('industry', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Telefone</label>
          <Input className="h-7 text-sm" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground">E-mail</label>
          <Input className="h-7 text-sm" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">CEP</label>
          <Input className="h-7 text-sm" value={form.cep} onChange={(e) => updateField('cep', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Estado</label>
          <Input className="h-7 text-sm" value={form.state} onChange={(e) => updateField('state', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground">Rua</label>
          <Input className="h-7 text-sm" value={form.street} onChange={(e) => updateField('street', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Numero</label>
          <Input className="h-7 text-sm" value={form.number} onChange={(e) => updateField('number', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Complemento</label>
          <Input className="h-7 text-sm" value={form.complement} onChange={(e) => updateField('complement', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Bairro</label>
          <Input className="h-7 text-sm" value={form.neighborhood} onChange={(e) => updateField('neighborhood', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Cidade</label>
          <Input className="h-7 text-sm" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
        </div>
      </div>
    </CardContent>
  )

  if (editing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Empresa
          </CardTitle>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving}>
              <X className="h-3 w-3" />
            </Button>
            <Button size="sm" onClick={saveCompany} disabled={saving || !form.name.trim()}>
              <Save className="h-3 w-3 mr-1" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardHeader>
        {EditForm}
      </Card>
    )
  }

  // Empty state — no company linked
  if (!company) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Empresa
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Plus className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          <button
            onClick={() => setEditing(true)}
            className="w-full text-sm text-muted-foreground hover:text-foreground border border-dashed rounded-md py-3 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Adicionar empresa
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4" />
          Empresa
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          <Pencil className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Link href={`/empresas/${company.id}`} className="block font-medium hover:underline">
          {company.trade_name ?? company.name}
        </Link>
        {company.trade_name && (
          <div className="text-xs text-muted-foreground">{company.name}</div>
        )}
        {company.cnpj && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">CNPJ</span>
            <span>{formatCNPJ(company.cnpj)}</span>
          </div>
        )}
        {company.industry && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Setor</span>
            <span>{company.industry}</span>
          </div>
        )}
        {company.email && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">E-mail</span>
            <span className="truncate ml-2">{company.email}</span>
          </div>
        )}
        {company.phone && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Telefone</span>
            <span>{company.phone}</span>
          </div>
        )}
        {(company.street || company.cep) && (
          <>
            <Separator />
            <div className="space-y-1">
              {company.street && (
                <div className="text-muted-foreground">
                  {company.street}{company.number ? `, ${company.number}` : ''}
                  {company.complement ? ` - ${company.complement}` : ''}
                </div>
              )}
              {company.neighborhood && (
                <div className="text-muted-foreground">{company.neighborhood}</div>
              )}
              {(company.city || company.state) && (
                <div className="text-muted-foreground">
                  {company.city}{company.state ? ` - ${company.state}` : ''}
                </div>
              )}
              {company.cep && (
                <div className="text-muted-foreground">CEP: {company.cep}</div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. CONTACT CARD + Quick Add
// ═══════════════════════════════════════════════════════════════════════════════

function ContactCard({ deal, onRefresh }: { deal: DealDetail; onRefresh: () => Promise<void> }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', position: '' })
  const [creating, setCreating] = useState(false)

  async function createContact() {
    if (!newContact.name.trim() || creating) return
    setCreating(true)
    try {
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newContact.name,
          email: newContact.email || null,
          phone: newContact.phone || null,
          position: newContact.position || null,
          company_id: deal.company_id,
        }),
      })
      setNewContact({ name: '', email: '', phone: '', position: '' })
      setShowAddForm(false)
      await onRefresh()
    } catch (err) {
      console.error('Failed to create contact:', err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4" />
          Contato
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-3 w-3 mr-1" />
          <span className="text-xs">Contato</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Primary contact */}
        <Link
          href={`/contatos/${deal.contact.id}`}
          className="block rounded-md border p-3 hover:bg-accent/50 transition-colors"
        >
          <div className="font-medium">{deal.contact.name}</div>
          {deal.contact.position && (
            <div className="text-sm text-muted-foreground">{deal.contact.position}</div>
          )}
          {deal.contact.email && (
            <div className="text-sm text-muted-foreground">{deal.contact.email}</div>
          )}
          {deal.contact.phone && (
            <div className="text-sm text-muted-foreground">{deal.contact.phone}</div>
          )}
        </Link>

        {/* Quick Add Contact Form */}
        {showAddForm && (
          <div className="rounded-md border border-dashed p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Novo contato</p>
            <Input
              placeholder="Nome *"
              className="h-7 text-sm"
              value={newContact.name}
              onChange={(e) => setNewContact((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="E-mail"
              type="email"
              className="h-7 text-sm"
              value={newContact.email}
              onChange={(e) => setNewContact((prev) => ({ ...prev, email: e.target.value }))}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Telefone"
                className="h-7 text-sm"
                value={newContact.phone}
                onChange={(e) => setNewContact((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <Input
                placeholder="Cargo"
                className="h-7 text-sm"
                value={newContact.position}
                onChange={(e) => setNewContact((prev) => ({ ...prev, position: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm" className="h-7 flex-1"
                onClick={createContact}
                disabled={!newContact.name.trim() || creating}
              >
                Criar Contato
              </Button>
              <Button size="sm" variant="ghost" className="h-7" onClick={() => setShowAddForm(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. FREIGHT CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════════

function FreightCard({ deal }: { deal: DealDetail }) {
  const [quotes, setQuotes] = useState<ShippingQuote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const cep = deal.company?.cep ?? null
  const hasItems = deal.deal_items.length > 0
  const canCalculate = hasItems && !!cep

  const calculateFreight = useCallback(async () => {
    if (!cep || !hasItems) return
    setLoading(true)
    setError(null)
    try {
      const firstItem = deal.deal_items[0]
      const res = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cep,
          product_id: firstItem.product_id,
          quantity: firstItem.quantity,
        }),
      })
      if (!res.ok) {
        throw new Error('Erro ao calcular frete')
      }
      const data = await res.json()
      setQuotes(Array.isArray(data) ? data : data.quotes ?? [])
    } catch (err) {
      setError('Nao foi possivel calcular o frete.')
      console.error('Freight error:', err)
    } finally {
      setLoading(false)
    }
  }, [cep, hasItems, deal.deal_items])

  // Auto-calculate on mount if data is available
  useEffect(() => {
    if (canCalculate && !hasFetched.current) {
      hasFetched.current = true
      calculateFreight()
    }
  }, [canCalculate, calculateFreight])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-4 w-4" />
          Frete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!canCalculate && (
          <p className="text-sm text-muted-foreground">
            {!hasItems && 'Adicione produtos para calcular frete.'}
            {hasItems && !cep && 'Empresa sem CEP cadastrado.'}
          </p>
        )}

        {canCalculate && quotes.length === 0 && !loading && !error && (
          <Button size="sm" variant="outline" onClick={calculateFreight} className="w-full">
            <Truck className="h-3 w-3 mr-2" />
            Calcular Frete
          </Button>
        )}

        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        {quotes.length > 0 && (
          <div className="space-y-2">
            {quotes.map((quote, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <div>
                  <div className="font-medium">{quote.carrier}</div>
                  <div className="text-xs text-muted-foreground">
                    {quote.delivery_days} dia{quote.delivery_days !== 1 ? 's' : ''} uteis
                  </div>
                </div>
                <span className="font-medium">{formatBRL(quote.price)}</span>
              </div>
            ))}
            <Button
              size="sm" variant="ghost" className="w-full text-xs"
              onClick={calculateFreight}
              disabled={loading}
            >
              Recalcular
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. CHAT HISTORY
// ═══════════════════════════════════════════════════════════════════════════════

function ChatHistoryCard({ conversations }: { conversations: ChatConversation[] }) {
  return (
    <div className="space-y-4">
      {conversations.map((convo) => (
        <ChatConversationCard key={convo.id} conversation={convo} />
      ))}
    </div>
  )
}

function ChatConversationCard({ conversation }: { conversation: ChatConversation }) {
  const [expanded, setExpanded] = useState(false)

  const TAG_COLORS: Record<string, string> = {
    interessado: 'bg-green-100 text-green-700',
    preco: 'bg-amber-100 text-amber-700',
    classico: 'bg-purple-100 text-purple-700',
    lite: 'bg-blue-100 text-blue-700',
    lite_plus: 'bg-cyan-100 text-cyan-700',
    corporativo: 'bg-indigo-100 text-indigo-700',
    urgente: 'bg-red-100 text-red-700',
  }

  function getTagColor(tag: string): string {
    const key = tag.toLowerCase().replace(/\s+/g, '_')
    return TAG_COLORS[key] ?? 'bg-gray-100 text-gray-700'
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4" />
          Conversa do Chat
          <span className="text-xs text-muted-foreground font-normal ml-auto">
            {conversation.message_count} msg
            {' '}&middot;{' '}
            {formatDateTime(conversation.created_at)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* AI Summary */}
        {conversation.ai_summary && (
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
            <div className="flex items-start gap-2">
              <Bot className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm leading-relaxed">{conversation.ai_summary}</p>
            </div>
          </div>
        )}

        {/* Tags */}
        {conversation.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {conversation.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className={`text-xs border-0 ${getTagColor(tag)}`}>
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Products discussed */}
        {conversation.products_discussed.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package className="h-3 w-3" />
            Produtos: {conversation.products_discussed.join(', ')}
          </div>
        )}

        {/* Expandable full conversation */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline cursor-pointer"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? 'Ocultar conversa' : 'Ver conversa completa'}
        </button>

        {expanded && conversation.messages.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto rounded-lg border p-3 bg-muted/20">
            {conversation.messages.map((msg, i) => {
              const isUser = msg.role === 'user' || msg.role === 'customer'
              return (
                <div key={i} className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <Bot className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${
                      isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border'
                    }`}
                  >
                    {msg.content}
                    {msg.timestamp && (
                      <div className={`text-[10px] mt-1 ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {formatDateTime(msg.timestamp)}
                      </div>
                    )}
                  </div>
                  {isUser && (
                    <UserCircle className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. LOGO & MOCKUP CARD
// ═══════════════════════════════════════════════════════════════════════════════

function LogoMockupCard({ activities }: { activities: CrmActivity[] }) {
  // Find the most recent activity with mockup/logo storage URLs
  const logoAct = [...activities]
    .reverse()
    .find((a) => {
      const m = a.metadata as Record<string, unknown> | null
      return m && (m.mockupStorageUrl || m.logoStorageUrl)
    })

  if (!logoAct) return null

  const meta = logoAct.metadata as Record<string, string | null>
  const mockupUrl = meta.mockupStorageUrl ?? null
  const logoUrl   = meta.logoStorageUrl   ?? null

  if (!mockupUrl && !logoUrl) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          Mockup e Logo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockupUrl && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Mockup</p>
            <div className="w-full rounded-lg overflow-hidden border bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mockupUrl}
                alt="Mockup do produto"
                className="w-full max-h-48 object-contain"
                loading="lazy"
              />
            </div>
            <a
              href={mockupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Baixar mockup em alta resolução
            </a>
          </div>
        )}
        {logoUrl && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Logo original</p>
            <div className="w-full h-16 rounded-lg overflow-hidden border bg-muted/10 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Logo da empresa"
                className="max-h-14 max-w-full object-contain"
                loading="lazy"
              />
            </div>
            <a
              href={logoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Baixar logo em alta resolução
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
