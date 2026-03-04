'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, XCircle, GripVertical, X, Plus, UserPlus, Palette, Copy, Check } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { CrmPipelineStage, CrmUserProfile } from '@/types/database'

// Predefined color palette for stages
const COLOR_OPTIONS = [
  { name: 'Cinza', bg: 'bg-gray-100 text-gray-800' },
  { name: 'Ardósia', bg: 'bg-slate-100 text-slate-800' },
  { name: 'Celeste', bg: 'bg-sky-100 text-sky-800' },
  { name: 'Ciano', bg: 'bg-cyan-100 text-cyan-800' },
  { name: 'Azul', bg: 'bg-blue-100 text-blue-800' },
  { name: 'Roxo', bg: 'bg-purple-100 text-purple-800' },
  { name: 'Índigo', bg: 'bg-indigo-100 text-indigo-800' },
  { name: 'Âmbar', bg: 'bg-amber-100 text-amber-800' },
  { name: 'Laranja', bg: 'bg-orange-100 text-orange-800' },
  { name: 'Verde', bg: 'bg-green-100 text-green-800' },
  { name: 'Esmeralda', bg: 'bg-emerald-100 text-emerald-800' },
  { name: 'Vermelho', bg: 'bg-red-100 text-red-800' },
  { name: 'Rosa', bg: 'bg-pink-100 text-pink-800' },
]

// Role labels for users
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Gerente',
  vendedor: 'Vendedor',
  viewer: 'Visualizador',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  vendedor: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
}

// ----- Sortable Stage Item Component -----

interface SortableStageItemProps {
  stage: CrmPipelineStage
  index: number
  onRename: (id: string, newName: string) => void
  onDelete: (id: string) => void
  onColorChange: (id: string, color: string) => void
}

function SortableStageItem({ stage, index, onRename, onDelete, onColorChange }: SortableStageItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(stage.name)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleStartEdit = () => {
    if (stage.is_won || stage.is_lost) return
    setEditName(stage.name)
    setIsEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleFinishEdit = () => {
    setIsEditing(false)
    const trimmed = editName.trim()
    if (trimmed && trimmed !== stage.name) {
      onRename(stage.id, trimmed)
    } else {
      setEditName(stage.name)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit()
    } else if (e.key === 'Escape') {
      setEditName(stage.name)
      setIsEditing(false)
    }
  }

  const isSpecial = stage.is_won || stage.is_lost

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-md border p-3"
    >
      <button
        type="button"
        className="cursor-grab touch-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <span className="w-8 text-center text-sm text-muted-foreground">
        {index + 1}
      </span>

      {/* Color Picker Popover wrapping the Badge */}
      <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="focus:outline-none" title="Alterar cor">
            <Badge
              variant="secondary"
              className={`${stage.color ?? 'bg-gray-100 text-gray-800'} cursor-pointer border-0 hover:opacity-80`}
            >
              {isEditing ? (
                <Input
                  ref={inputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleFinishEdit}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 w-24 border-0 bg-transparent p-0 text-xs font-medium shadow-none focus-visible:ring-0"
                />
              ) : (
                <span onClick={(e) => { e.stopPropagation(); handleStartEdit() }}>
                  {stage.name}
                </span>
              )}
            </Badge>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <Palette className="h-3.5 w-3.5" />
            Cor do estágio
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.bg}
                type="button"
                title={color.name}
                className={`h-7 w-full rounded-md border ${color.bg} text-[10px] font-medium transition-all hover:scale-105 ${
                  stage.color === color.bg ? 'ring-2 ring-ring ring-offset-1' : ''
                }`}
                onClick={() => {
                  onColorChange(stage.id, color.bg)
                  setColorPickerOpen(false)
                }}
              >
                Aa
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Stage name click-to-edit (when badge click opens color picker, we use a separate edit button) */}
      {!isEditing && !isSpecial && (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleStartEdit}
          title="Renomear estágio"
        >
          Renomear
        </button>
      )}

      <div className="flex-1" />

      {stage.is_won && (
        <div className="flex items-center gap-1 text-sm text-green-600">
          <Trophy className="h-4 w-4" />
          Ganho
        </div>
      )}
      {stage.is_lost && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <XCircle className="h-4 w-4" />
          Perdido
        </div>
      )}

      {/* Delete button (hidden for is_won/is_lost) */}
      {!isSpecial && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(stage.id)}
          title="Excluir estágio"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

// ----- InviteLink (copy to clipboard) -----

function InviteLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted p-2">
      <span className="flex-1 truncate text-xs font-mono text-muted-foreground">{link}</span>
      <Button type="button" variant="ghost" size="icon-xs" onClick={copy} title="Copiar link">
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  )
}

// ----- Main Page -----

export default function ConfiguracoesPage() {
  const [stages, setStages] = useState<CrmPipelineStage[]>([])
  const [users, setUsers] = useState<CrmUserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [stageToDelete, setStageToDelete] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Invite dialog
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('seller')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ link?: string; error?: string } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  useEffect(() => {
    fetch('/api/pipeline-stages')
      .then((res) => res.json())
      .then((data) => setStages(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))

    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setUsersLoading(false))
  }, [])

  // ----- Stage operations -----

  const handleRename = useCallback(async (id: string, newName: string) => {
    // Optimistic update
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, name: newName } : s)))

    const res = await fetch(`/api/pipeline-stages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })

    if (!res.ok) {
      // Revert on failure
      const updated = await fetch('/api/pipeline-stages').then((r) => r.json())
      setStages(updated)
    }
  }, [])

  const handleColorChange = useCallback(async (id: string, color: string) => {
    // Optimistic update
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, color } : s)))

    const res = await fetch(`/api/pipeline-stages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color }),
    })

    if (!res.ok) {
      const updated = await fetch('/api/pipeline-stages').then((r) => r.json())
      setStages(updated)
    }
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setStages((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id)
      const newIndex = prev.findIndex((s) => s.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })

    // Send reorder to API after optimistic update
    // We need to get the new order after the state update
    setStages((prev) => {
      const reorderPayload = prev.map((s, i) => ({ id: s.id, position: i }))
      fetch('/api/pipeline-stages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reorderPayload),
      }).catch(console.error)
      return prev
    })
  }, [])

  const handleAddStage = useCallback(async () => {
    const res = await fetch('/api/pipeline-stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Novo Estágio',
        position: stages.length,
        color: 'bg-gray-100 text-gray-800',
      }),
    })

    if (res.ok) {
      const updated = await fetch('/api/pipeline-stages').then((r) => r.json())
      setStages(updated)
    }
  }, [stages.length])

  const handleDeleteClick = (id: string) => {
    setStageToDelete(id)
    setDeleteError(null)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!stageToDelete) return

    const res = await fetch(`/api/pipeline-stages/${stageToDelete}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      setStages((prev) => prev.filter((s) => s.id !== stageToDelete))
      setDeleteDialogOpen(false)
      setStageToDelete(null)
    } else if (res.status === 409) {
      const data = await res.json()
      setDeleteError(data.error || 'Não é possível excluir este estágio porque existem negócios associados.')
    } else {
      setDeleteError('Erro ao excluir estágio. Tente novamente.')
    }
  }

  const stageToDeleteName = stages.find((s) => s.id === stageToDelete)?.name ?? ''

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteResult(null)
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, crm_role: inviteRole, target_app: 'crm' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInviteResult({ error: data.error ?? 'Erro ao enviar convite' })
      } else {
        const baseUrl = window.location.origin
        const link = `${baseUrl}/register?token=${data.invitation.token}`
        setInviteResult({ link: data.emailSent ? undefined : link })
        if (data.emailSent) {
          setTimeout(() => {
            setInviteDialogOpen(false)
            setInviteEmail('')
            setInviteRole('seller')
            setInviteResult(null)
          }, 2000)
        }
      }
    } catch {
      setInviteResult({ error: 'Erro de conexão' })
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie as configurações do seu CRM"
      />

      {/* Pipeline Stages Card */}
      <Card>
        <CardHeader>
          <CardTitle>Estágios do Pipeline</CardTitle>
          <CardDescription>
            Configure os estágios do seu funil de vendas. Arraste para reordenar, clique no nome para renomear, e clique no badge para alterar a cor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={stages.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {stages.map((stage, index) => (
                    <SortableStageItem
                      key={stage.id}
                      stage={stage}
                      index={index}
                      onRename={handleRename}
                      onDelete={handleDeleteClick}
                      onColorChange={handleColorChange}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {!loading && (
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={handleAddStage}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Estágio
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Users Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>
                Gerencie os usuários do CRM e suas permissões.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Convidar Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  <Avatar size="sm">
                    <AvatarFallback>
                      {user.display_name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Select
                    value={user.role}
                    onValueChange={(val) => handleRoleChange(user.id, val)}
                  >
                    <SelectTrigger className={`h-7 w-32 text-xs border-0 ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-800'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="seller">Vendedor</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                  {!user.active && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inativo
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* About CRM Card */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre o CRM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Winepopper CRM v1.0</p>
          <p>CRM para gestão de leads B2B — Brindes Corporativos</p>
          <p>Banco de dados: Supabase (PostgreSQL)</p>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Estágio</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o estágio &ldquo;{stageToDeleteName}&rdquo;? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {deleteError}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={(open) => {
        setInviteDialogOpen(open)
        if (!open) { setInviteEmail(''); setInviteRole('seller'); setInviteResult(null) }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Usuário</DialogTitle>
            <DialogDescription>
              O convidado receberá um link para criar sua conta com as permissões selecionadas.
            </DialogDescription>
          </DialogHeader>

          {inviteResult?.error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {inviteResult.error}
            </div>
          )}

          {inviteResult && !inviteResult.error && !inviteResult.link && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Convite enviado com sucesso para {inviteEmail}!
            </div>
          )}

          {inviteResult?.link && (
            <div className="space-y-2">
              <p className="text-sm text-green-700 font-medium">Convite criado! Como o e-mail não foi configurado, copie o link abaixo:</p>
              <InviteLink link={inviteResult.link} />
            </div>
          )}

          {!inviteResult && (
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">E-mail</label>
                <Input
                  type="email"
                  placeholder="nome@empresa.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Permissão no CRM</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <span className="font-medium">Admin</span>
                      <span className="ml-2 text-xs text-muted-foreground">Acesso total</span>
                    </SelectItem>
                    <SelectItem value="manager">
                      <span className="font-medium">Gerente</span>
                      <span className="ml-2 text-xs text-muted-foreground">Gerencia equipe e negócios</span>
                    </SelectItem>
                    <SelectItem value="seller">
                      <span className="font-medium">Vendedor</span>
                      <span className="ml-2 text-xs text-muted-foreground">Acesso aos próprios negócios</span>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <span className="font-medium">Visualizador</span>
                      <span className="ml-2 text-xs text-muted-foreground">Somente leitura</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={inviteLoading}>
                  {inviteLoading ? 'Enviando...' : 'Enviar Convite'}
                </Button>
              </DialogFooter>
            </form>
          )}

          {inviteResult && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
