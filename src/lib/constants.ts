import type { CrmDealPriority, CrmTaskStatus, CrmTaskType, CrmActivityType, CrmLeadSource, CrmCompanySize, CrmProductInterest } from '@/types/database'

// Labels em português

export const PRIORITY_LABELS: Record<CrmDealPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}

export const PRIORITY_COLORS: Record<CrmDealPriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
}

export const TASK_STATUS_LABELS: Record<CrmTaskStatus, string> = {
  pending: 'Pendente',
  completed: 'Concluída',
  cancelled: 'Cancelada',
}

export const TASK_STATUS_COLORS: Record<CrmTaskStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-700',
}

export const TASK_TYPE_LABELS: Record<CrmTaskType, string> = {
  call: 'Ligação',
  email: 'E-mail',
  meeting: 'Reunião',
  follow_up: 'Follow-up',
  other: 'Outro',
}

export const TASK_TYPE_ICONS: Record<CrmTaskType, string> = {
  call: 'Phone',
  email: 'Mail',
  meeting: 'Calendar',
  follow_up: 'RotateCw',
  other: 'MoreHorizontal',
}

export const ACTIVITY_TYPE_LABELS: Record<CrmActivityType, string> = {
  note: 'Nota',
  email: 'E-mail',
  call: 'Ligação',
  meeting: 'Reunião',
  stage_change: 'Mudança de Estágio',
  deal_created: 'Negócio Criado',
  deal_won: 'Negócio Ganho',
  deal_lost: 'Negócio Perdido',
}

export const LEAD_SOURCE_LABELS: Record<CrmLeadSource, string> = {
  site: 'Site',
  indicacao: 'Indicação',
  linkedin: 'LinkedIn',
  telefone: 'Telefone',
  evento: 'Evento',
  meta_ads: 'Meta Ads',
  landing_page: 'Landing Page',
  outro: 'Outro',
}

export const COMPANY_SIZE_LABELS: Record<CrmCompanySize, string> = {
  micro: 'Micro',
  small: 'Pequena',
  medium: 'Média',
  large: 'Grande',
}

export const PRODUCT_INTEREST_LABELS: Record<CrmProductInterest, string> = {
  classico: 'Clássico (R$190)',
  lite_plus: 'Lite Plus (R$135)',
  lite: 'Lite (R$90)',
}

// Cores padrão dos estágios do pipeline
export const DEFAULT_STAGE_COLORS = [
  'bg-slate-100 text-slate-800',
  'bg-sky-100 text-sky-800',
  'bg-cyan-100 text-cyan-800',
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-amber-100 text-amber-800',
  'bg-green-100 text-green-800',
  'bg-red-100 text-red-800',
]

// Formatação de moeda brasileira
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Formatação de data brasileira
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

// Formatar CNPJ
export function formatCNPJ(doc: string): string {
  const digits = doc.replace(/\D/g, '')
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return doc
}

// Dias atrás / daqui a X dias
export function daysAgo(date: string | Date): number {
  const now = new Date()
  const d = new Date(date)
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}
