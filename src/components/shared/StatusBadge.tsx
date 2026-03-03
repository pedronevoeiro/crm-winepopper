import { Badge } from '@/components/ui/badge'
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants'
import type { CrmTaskStatus, CrmDealPriority } from '@/types/database'

interface StatusBadgeProps {
  status: string
  type: 'task' | 'priority' | 'custom'
  customLabel?: string
  customColor?: string
}

export function StatusBadge({ status, type, customLabel, customColor }: StatusBadgeProps) {
  let label = customLabel ?? status
  let color = customColor ?? 'bg-gray-100 text-gray-700'

  if (type === 'task') {
    label = TASK_STATUS_LABELS[status as CrmTaskStatus] ?? status
    color = TASK_STATUS_COLORS[status as CrmTaskStatus] ?? color
  } else if (type === 'priority') {
    label = PRIORITY_LABELS[status as CrmDealPriority] ?? status
    color = PRIORITY_COLORS[status as CrmDealPriority] ?? color
  }

  return (
    <Badge variant="secondary" className={`${color} border-0 font-medium`}>
      {label}
    </Badge>
  )
}
