'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { Plus, ArrowUpDown, UserCircle } from 'lucide-react'
import type { CrmPipelineStage, CrmDealWithRelations, CrmUserProfile, CrmFunnel } from '@/types/database'

type SortBy = 'created_at' | 'value' | 'priority'

export default function PipelinePage() {
  return (
    <Suspense>
      <PipelineContent />
    </Suspense>
  )
}

function PipelineContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [funnels, setFunnels] = useState<CrmFunnel[]>([])
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null)
  const [stages, setStages] = useState<CrmPipelineStage[]>([])
  const [deals, setDeals] = useState<CrmDealWithRelations[]>([])
  const [users, setUsers] = useState<CrmUserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortBy>('created_at')
  const [ownerId, setOwnerId] = useState<string>('all')

  const fetchDeals = useCallback(async (sort: SortBy, owner: string, funnelId: string | null) => {
    const params = new URLSearchParams({ sort_by: sort })
    if (owner && owner !== 'all') params.set('owner_id', owner)
    if (funnelId) params.set('funnel_id', funnelId)
    const res = await fetch(`/api/deals?${params.toString()}`)
    return res.json()
  }, [])

  const fetchStages = useCallback(async (funnelId: string | null) => {
    const params = funnelId ? `?funnel_id=${funnelId}` : ''
    const res = await fetch(`/api/pipeline-stages${params}`)
    return res.json()
  }, [])

  // Initial load
  useEffect(() => {
    Promise.all([
      fetch('/api/funnels').then((r) => r.json()),
      fetch('/api/users').then((r) => r.json()),
    ])
      .then(([f, u]) => {
        const funnelList: CrmFunnel[] = Array.isArray(f) ? f : []
        setFunnels(funnelList)
        setUsers(Array.isArray(u) ? u : [])

        // Determine initial funnel from URL or first funnel
        const urlFunnel = searchParams.get('funnel')
        const initialFunnel = funnelList.find((fn) => fn.slug === urlFunnel) ?? funnelList[0]
        const funnelId = initialFunnel?.id ?? null
        setActiveFunnelId(funnelId)

        return Promise.all([
          fetchStages(funnelId),
          fetchDeals('created_at', 'all', funnelId),
        ])
      })
      .then(([s, d]) => {
        setStages(Array.isArray(s) ? s : [])
        setDeals(Array.isArray(d) ? d : [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when sort/owner changes
  useEffect(() => {
    if (loading) return
    fetchDeals(sortBy, ownerId, activeFunnelId)
      .then((d) => setDeals(Array.isArray(d) ? d : []))
      .catch(console.error)
  }, [sortBy, ownerId, fetchDeals, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFunnelChange = useCallback((funnel: CrmFunnel) => {
    setActiveFunnelId(funnel.id)
    router.replace(`/pipeline?funnel=${funnel.slug}`, { scroll: false })

    Promise.all([
      fetchStages(funnel.id),
      fetchDeals(sortBy, ownerId, funnel.id),
    ])
      .then(([s, d]) => {
        setStages(Array.isArray(s) ? s : [])
        setDeals(Array.isArray(d) ? d : [])
      })
      .catch(console.error)
  }, [sortBy, ownerId, fetchStages, fetchDeals, router])

  const handleDealMove = useCallback((dealId: string, newStageId: string, newPosition: number) => {
    setDeals((prev) =>
      prev.map((d) => d.id === dealId ? { ...d, stage_id: newStageId, position: newPosition } : d)
    )
    fetch(`/api/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: newStageId, position: newPosition }),
    })
      .then(() => fetchDeals(sortBy, ownerId, activeFunnelId))
      .then((updated) => setDeals(Array.isArray(updated) ? updated : []))
      .catch(console.error)
  }, [sortBy, ownerId, activeFunnelId, fetchDeals])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-24" />)}
        </div>
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 w-72" />)}
        </div>
      </div>
    )
  }

  const openDeals = deals.filter((d) => {
    const stage = stages.find((s) => s.id === d.stage_id)
    return stage && !stage.is_won && !stage.is_lost
  })
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description={`${openDeals.length} negócios em aberto · Valor total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pipelineValue)}`}
        actions={
          <Link href="/negocios/novo">
            <Button><Plus className="mr-2 h-4 w-4" />Novo Negócio</Button>
          </Link>
        }
      />

      {/* Funnel Tabs */}
      <div className="flex flex-wrap gap-1 border-b">
        {funnels.map((funnel) => {
          const isActive = funnel.id === activeFunnelId
          return (
            <button
              key={funnel.id}
              onClick={() => handleFunnelChange(funnel)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
            >
              {funnel.name}
            </button>
          )
        })}
      </div>

      {/* Sort & Filter Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Ordenar por:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Data de entrada</SelectItem>
              <SelectItem value="value">Valor</SelectItem>
              <SelectItem value="priority">Prioridade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <UserCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Vendedor:</span>
          <Select value={ownerId} onValueChange={setOwnerId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <KanbanBoard stages={stages} deals={deals} onDealMove={handleDealMove} sortBy={sortBy} />
    </div>
  )
}
