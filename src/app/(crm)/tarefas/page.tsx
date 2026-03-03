'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { formatDate, formatDateTime, TASK_TYPE_LABELS, PRIORITY_LABELS } from '@/lib/constants'
import { Plus, Phone, Mail, Calendar, RotateCw, MoreHorizontal, AlertCircle } from 'lucide-react'
import type { CrmTaskWithRelations, CrmTaskType } from '@/types/database'
import Link from 'next/link'

const TASK_TYPE_ICON_MAP: Record<string, React.ElementType> = {
  call: Phone, email: Mail, meeting: Calendar, follow_up: RotateCw, other: MoreHorizontal,
}

export default function TarefasPage() {
  const [tasks, setTasks] = useState<CrmTaskWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  async function loadTasks(f?: string) {
    const filterParam = f && f !== 'all' && f !== 'completed' ? `?filter=${f}` : f === 'completed' ? '?status=completed' : ''
    const data = await fetch(`/api/tasks${filterParam}`).then((r) => r.json())
    setTasks(data)
    setLoading(false)
  }

  useEffect(() => { loadTasks(filter) }, [filter])

  async function toggleComplete(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    loadTasks(filter)
  }

  async function createTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const body = {
      title: formData.get('title'),
      type: formData.get('type'),
      priority: formData.get('priority') || 'medium',
      due_date: formData.get('due_date') ? new Date(formData.get('due_date') as string).toISOString() : null,
      description: formData.get('description') || null,
    }
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setDialogOpen(false)
    loadTasks(filter)
  }

  const overdueTasks = tasks.filter((t) => {
    if (!t.due_date || t.status !== 'pending') return false
    return new Date(t.due_date) < new Date()
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarefas"
        description={overdueTasks.length > 0 ? `${overdueTasks.length} tarefa(s) atrasada(s)` : 'Gerencie suas tarefas e follow-ups'}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nova Tarefa</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
              <form onSubmit={createTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select name="type" required defaultValue="follow_up">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TASK_TYPE_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select name="priority" defaultValue="medium">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Data de Vencimento</Label>
                  <Input id="due_date" name="due_date" type="datetime-local" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input id="description" name="description" />
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Criar Tarefa</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="overdue" className="relative">
            Atrasadas
            {overdueTasks.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {overdueTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">Próximas</TabsTrigger>
          <TabsTrigger value="completed">Concluídas</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <CheckSquare className="h-8 w-8" />
                  <p>Nenhuma tarefa encontrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => {
                    const Icon = TASK_TYPE_ICON_MAP[task.type] ?? MoreHorizontal
                    const isOverdue = task.due_date && task.status === 'pending' && new Date(task.due_date) < new Date()

                    return (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${
                          isOverdue ? 'border-red-200 bg-red-50' : ''
                        }`}
                      >
                        <Checkbox
                          checked={task.status === 'completed'}
                          onCheckedChange={() => toggleComplete(task.id, task.status)}
                        />
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {task.deal && (
                              <Link href={`/negocios/${task.deal.id}`} className="hover:underline">
                                {task.deal.title}
                              </Link>
                            )}
                            {task.contact && (
                              <Link href={`/contatos/${task.contact.id}`} className="hover:underline">
                                {task.contact.name}
                              </Link>
                            )}
                            {task.assigned_user && <span>· {task.assigned_user.display_name}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <PriorityBadge priority={task.priority} />
                          {task.due_date && (
                            <span className={`text-xs ${isOverdue ? 'font-medium text-red-600' : 'text-muted-foreground'}`}>
                              {isOverdue && <AlertCircle className="mr-1 inline h-3 w-3" />}
                              {formatDate(task.due_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CheckSquare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
  )
}
