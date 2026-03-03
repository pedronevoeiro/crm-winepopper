'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityTimeline } from '@/components/shared/ActivityTimeline'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatBRL, formatDate, daysAgo, PRODUCT_INTEREST_LABELS, LEAD_SOURCE_LABELS, TASK_STATUS_LABELS, TASK_TYPE_LABELS } from '@/lib/constants'
import { Building2, User, Calendar, CheckSquare, Plus } from 'lucide-react'
import type { CrmDeal, CrmPipelineStage, CrmCompany, CrmContact, CrmActivity, CrmTask } from '@/types/database'
import { users } from '@/lib/data'

interface DealDetail extends CrmDeal {
  stage: CrmPipelineStage
  company: CrmCompany | null
  contact: CrmContact
  activities: CrmActivity[]
  tasks: CrmTask[]
}

export default function NegocioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [deal, setDeal] = useState<DealDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activityContent, setActivityContent] = useState('')
  const [activityType, setActivityType] = useState('note')

  useEffect(() => {
    fetch(`/api/deals/${id}`)
      .then((res) => res.json())
      .then(setDeal)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  async function addActivity() {
    if (!activityContent.trim() || !deal) return

    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deal_id: deal.id,
        contact_id: deal.contact_id,
        company_id: deal.company_id,
        user_id: 'u1',
        type: activityType,
        content: activityContent,
      }),
    })

    setActivityContent('')
    // Refresh
    const updated = await fetch(`/api/deals/${id}`).then((r) => r.json())
    setDeal(updated)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-3"><Skeleton className="h-64 col-span-2" /><Skeleton className="h-64" /></div>
      </div>
    )
  }

  if (!deal) {
    return <div className="text-muted-foreground">Negócio não encontrado</div>
  }

  const activitiesWithUser = deal.activities.map((a) => ({
    ...a,
    user: users.find((u) => u.id === a.user_id) ?? null,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={deal.title}
        description={`Estágio: ${deal.stage.name}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`${deal.stage.color} border-0`}>
              {deal.stage.name}
            </Badge>
            <PriorityBadge priority={deal.priority} />
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-6 md:col-span-2">
          {/* Adicionar atividade */}
          <Card>
            <CardHeader><CardTitle>Adicionar Atividade</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Nota</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="call">Ligação</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
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

          {/* Timeline */}
          <Card>
            <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
            <CardContent>
              <ActivityTimeline activities={activitiesWithUser} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Detalhes */}
          <Card>
            <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {deal.value && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-semibold text-green-700">{formatBRL(deal.value)}</span>
                </div>
              )}
              {deal.product_interest && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produto</span>
                  <span>{PRODUCT_INTEREST_LABELS[deal.product_interest]}</span>
                </div>
              )}
              {deal.expected_quantity && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantidade</span>
                  <span>{deal.expected_quantity} un.</span>
                </div>
              )}
              {deal.expected_close_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Previsão</span>
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
                <span className="text-muted-foreground">Dias no estágio</span>
                <span>{daysAgo(deal.stage_entered_at)} dias</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{formatDate(deal.created_at)}</span>
              </div>
              {deal.lost_reason && (
                <div className="rounded-md bg-red-50 p-2 text-sm text-red-800">
                  <strong>Motivo da perda:</strong> {deal.lost_reason}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4" />Contato</CardTitle></CardHeader>
            <CardContent>
              <Link href={`/contatos/${deal.contact.id}`} className="block rounded-md border p-3 hover:bg-accent/50 transition-colors">
                <div className="font-medium">{deal.contact.name}</div>
                {deal.contact.position && <div className="text-sm text-muted-foreground">{deal.contact.position}</div>}
                {deal.contact.email && <div className="text-sm text-muted-foreground">{deal.contact.email}</div>}
              </Link>
            </CardContent>
          </Card>

          {/* Empresa */}
          {deal.company && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" />Empresa</CardTitle></CardHeader>
              <CardContent>
                <Link href={`/empresas/${deal.company.id}`} className="block rounded-md border p-3 hover:bg-accent/50 transition-colors">
                  <div className="font-medium">{deal.company.trade_name ?? deal.company.name}</div>
                  {deal.company.industry && <div className="text-sm text-muted-foreground">{deal.company.industry}</div>}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Tarefas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><CheckSquare className="h-4 w-4" />Tarefas</CardTitle>
              <Link href={`/tarefas?deal_id=${deal.id}`}>
                <Button variant="ghost" size="sm"><Plus className="h-3 w-3" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {deal.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma tarefa</p>
              ) : (
                <div className="space-y-2">
                  {deal.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <div>
                        <div className={task.status === 'completed' ? 'line-through text-muted-foreground' : 'font-medium'}>
                          {task.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {TASK_TYPE_LABELS[task.type]}
                          {task.due_date && ` · ${formatDate(task.due_date)}`}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {TASK_STATUS_LABELS[task.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
