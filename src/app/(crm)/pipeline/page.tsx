'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { CrmPipelineStage, CrmDealWithRelations } from '@/types/database'

export default function PipelinePage() {
  const [stages, setStages] = useState<CrmPipelineStage[]>([])
  const [deals, setDeals] = useState<CrmDealWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/pipeline-stages').then((r) => r.json()),
      fetch('/api/deals').then((r) => r.json()),
    ])
      .then(([s, d]) => {
        setStages(s)
        setDeals(d)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDealMove = useCallback(async (dealId: string, newStageId: string, newPosition: number) => {
    await fetch(`/api/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: newStageId, position: newPosition }),
    })

    // Refresh deals
    const updated = await fetch('/api/deals').then((r) => r.json())
    setDeals(updated)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-72" />
          ))}
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

      <KanbanBoard stages={stages} deals={deals} onDealMove={handleDealMove} />
    </div>
  )
}
