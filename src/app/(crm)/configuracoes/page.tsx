'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy, XCircle, GripVertical } from 'lucide-react'
import type { CrmPipelineStage } from '@/types/database'

export default function ConfiguracoesPage() {
  const [stages, setStages] = useState<CrmPipelineStage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/pipeline-stages')
      .then((res) => res.json())
      .then(setStages)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie as configurações do seu CRM"
      />

      <Card>
        <CardHeader>
          <CardTitle>Estágios do Pipeline</CardTitle>
          <CardDescription>
            Configure os estágios do seu funil de vendas. Os negócios passam por esses estágios da esquerda para a direita no Kanban.
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
            <div className="space-y-2">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="w-8 text-center text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`${stage.color ?? 'bg-gray-100 text-gray-800'} border-0`}
                  >
                    {stage.name}
                  </Badge>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  )
}
