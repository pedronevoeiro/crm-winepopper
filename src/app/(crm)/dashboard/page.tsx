'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL, formatDate } from '@/lib/constants'
import { Users, TrendingUp, DollarSign, Target, CheckSquare, AlertCircle } from 'lucide-react'
import {
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

interface DashboardData {
  kpis: {
    total_leads: number
    conversion_rate: number
    avg_deal_value: number
    revenue_this_month: number
    pipeline_value: number
    pending_tasks: number
    overdue_tasks: number
    won_deals: number
    lost_deals: number
  }
  deals_by_stage: { name: string; count: number; value: number }[]
  deals_by_source: { source: string; count: number }[]
  revenue_by_month: { month: string; revenue: number }[]
  avg_time_by_stage: { name: string; days: number }[]
  recent_deals: { id: string; title: string; value: number | null; stage: string; contact: string; created_at: string }[]
}

const PIE_COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

const SOURCE_LABELS: Record<string, string> = {
  site: 'Site', indicacao: 'Indicação', linkedin: 'LinkedIn',
  telefone: 'Telefone', evento: 'Evento', outro: 'Outro',
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const kpis = data ? [
    { title: 'Leads em Aberto', value: String(data.kpis.total_leads), icon: Users, color: 'text-blue-600', description: 'negócios no pipeline' },
    { title: 'Taxa de Conversão', value: `${data.kpis.conversion_rate}%`, icon: TrendingUp, color: 'text-green-600', description: `${data.kpis.won_deals} ganhos / ${data.kpis.lost_deals} perdidos` },
    { title: 'Valor Médio', value: formatBRL(data.kpis.avg_deal_value), icon: Target, color: 'text-purple-600', description: 'por negócio ganho' },
    { title: 'Valor do Pipeline', value: formatBRL(data.kpis.pipeline_value), icon: DollarSign, color: 'text-amber-600', description: 'em negociação' },
    { title: 'Tarefas Pendentes', value: String(data.kpis.pending_tasks), icon: CheckSquare, color: 'text-indigo-600', description: 'ações a realizar' },
    { title: 'Tarefas Atrasadas', value: String(data.kpis.overdue_tasks), icon: AlertCircle, color: 'text-red-600', description: 'precisam de atenção' },
  ] : []

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Visão geral do seu CRM" />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16" /></CardContent></Card>
            ))
          : kpis.map((kpi) => (
              <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </CardContent>
              </Card>
            ))
        }
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Funil */}
        <Card>
          <CardHeader><CardTitle>Funil de Vendas</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-64" /> : !data?.deals_by_stage.length ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.deals_by_stage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
                  <Tooltip formatter={(value, name) => [
                    name === 'count' ? `${value} negócios` : formatBRL(Number(value)),
                    name === 'count' ? 'Quantidade' : 'Valor',
                  ]} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Receita por mês */}
        <Card>
          <CardHeader><CardTitle>Receita Mensal</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-64" /> : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data?.revenue_by_month ?? []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatBRL(v)} />
                  <Tooltip formatter={(v) => [formatBRL(Number(v)), 'Receita']} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Leads por fonte */}
        <Card>
          <CardHeader><CardTitle>Leads por Fonte</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-64" /> : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={(data?.deals_by_source ?? []).map((d) => ({ ...d, name: SOURCE_LABELS[d.source] ?? d.source }))}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    paddingAngle={2} dataKey="count"
                  >
                    {(data?.deals_by_source ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} negócios`, 'Quantidade']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tempo médio por estágio */}
        <Card>
          <CardHeader><CardTitle>Tempo Médio por Estágio</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-64" /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.avg_time_by_stage ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v} dias`, 'Tempo médio']} />
                  <Bar dataKey="days" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Negócios Recentes */}
      <Card>
        <CardHeader><CardTitle>Negócios Recentes</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negócio</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Estágio</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.recent_deals ?? []).map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <Link href={`/negocios/${deal.id}`} className="font-medium hover:underline">
                        {deal.title}
                      </Link>
                    </TableCell>
                    <TableCell>{deal.contact}</TableCell>
                    <TableCell>{deal.stage}</TableCell>
                    <TableCell>{deal.value ? formatBRL(deal.value) : '-'}</TableCell>
                    <TableCell>{formatDate(deal.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
