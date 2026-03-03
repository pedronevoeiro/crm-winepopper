import { Badge } from '@/components/ui/badge'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants'
import type { CrmDealPriority } from '@/types/database'

export function PriorityBadge({ priority }: { priority: CrmDealPriority }) {
  return (
    <Badge variant="secondary" className={`${PRIORITY_COLORS[priority]} border-0 font-medium`}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  )
}
