import { NextResponse } from 'next/server'
import { deals, pipelineStages, tasks, contacts } from '@/lib/data'

export async function GET() {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // KPIs
  const allOpenDeals = deals.filter((d) => {
    const stage = pipelineStages.find((s) => s.id === d.stage_id)
    return stage && !stage.is_won && !stage.is_lost
  })

  const wonDeals = deals.filter((d) => {
    const stage = pipelineStages.find((s) => s.id === d.stage_id)
    return stage?.is_won
  })

  const lostDeals = deals.filter((d) => {
    const stage = pipelineStages.find((s) => s.id === d.stage_id)
    return stage?.is_lost
  })

  const wonThisMonth = wonDeals.filter((d) => d.won_at && new Date(d.won_at) >= thisMonth)
  const revenueThisMonth = wonThisMonth.reduce((sum, d) => sum + (d.value ?? 0), 0)

  const totalDeals = deals.length
  const conversionRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0
  const avgDealValue = wonDeals.length > 0
    ? wonDeals.reduce((sum, d) => sum + (d.value ?? 0), 0) / wonDeals.length
    : 0
  const pipelineValue = allOpenDeals.reduce((sum, d) => sum + (d.value ?? 0), 0)

  const pendingTasks = tasks.filter((t) => t.status === 'pending')
  const overdueTasks = pendingTasks.filter((t) => t.due_date && new Date(t.due_date) < now)

  // Deals por estágio (funil)
  const dealsByStage = pipelineStages
    .filter((s) => !s.is_won && !s.is_lost)
    .map((stage) => {
      const stageDeals = deals.filter((d) => d.stage_id === stage.id)
      return {
        name: stage.name,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0),
      }
    })

  // Deals por fonte
  const sourceMap: Record<string, number> = {}
  deals.forEach((d) => {
    const source = d.source ?? 'outro'
    sourceMap[source] = (sourceMap[source] ?? 0) + 1
  })
  const dealsBySource = Object.entries(sourceMap).map(([source, count]) => ({
    source,
    count,
  }))

  // Receita por mês (últimos 6 meses)
  const revenueByMonth: { month: string; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const monthRevenue = wonDeals
      .filter((deal) => deal.won_at && new Date(deal.won_at) >= d && new Date(deal.won_at) < end)
      .reduce((sum, deal) => sum + (deal.value ?? 0), 0)
    revenueByMonth.push({
      month: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      revenue: monthRevenue,
    })
  }

  // Tempo médio por estágio (simplificado)
  const avgTimeByStage = pipelineStages
    .filter((s) => !s.is_won && !s.is_lost)
    .map((stage) => {
      const stageDeals = deals.filter((d) => d.stage_id === stage.id)
      const avgDays = stageDeals.length > 0
        ? stageDeals.reduce((sum, d) => {
            const days = Math.floor((now.getTime() - new Date(d.stage_entered_at).getTime()) / (1000 * 60 * 60 * 24))
            return sum + days
          }, 0) / stageDeals.length
        : 0
      return { name: stage.name, days: Math.round(avgDays) }
    })

  // Negócios recentes
  const recentDeals = [...deals]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((d) => ({
      id: d.id,
      title: d.title,
      value: d.value,
      stage: pipelineStages.find((s) => s.id === d.stage_id)?.name ?? '',
      contact: contacts.find((c) => c.id === d.contact_id)?.name ?? '',
      created_at: d.created_at,
    }))

  return NextResponse.json({
    kpis: {
      total_leads: allOpenDeals.length,
      conversion_rate: Math.round(conversionRate * 10) / 10,
      avg_deal_value: Math.round(avgDealValue),
      revenue_this_month: revenueThisMonth,
      pipeline_value: pipelineValue,
      pending_tasks: pendingTasks.length,
      overdue_tasks: overdueTasks.length,
      won_deals: wonDeals.length,
      lost_deals: lostDeals.length,
    },
    deals_by_stage: dealsByStage,
    deals_by_source: dealsBySource,
    revenue_by_month: revenueByMonth,
    avg_time_by_stage: avgTimeByStage,
    recent_deals: recentDeals,
  })
}
