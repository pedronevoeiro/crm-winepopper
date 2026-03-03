'use client'

import {
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  ArrowRight,
  Plus,
  Trophy,
  XCircle,
} from 'lucide-react'
import { formatDateTime, ACTIVITY_TYPE_LABELS } from '@/lib/constants'
import type { CrmActivityWithUser } from '@/types/database'

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  note: MessageSquare,
  email: Mail,
  call: Phone,
  meeting: Calendar,
  stage_change: ArrowRight,
  deal_created: Plus,
  deal_won: Trophy,
  deal_lost: XCircle,
}

const ACTIVITY_COLORS: Record<string, string> = {
  note: 'bg-gray-100 text-gray-600',
  email: 'bg-blue-100 text-blue-600',
  call: 'bg-green-100 text-green-600',
  meeting: 'bg-purple-100 text-purple-600',
  stage_change: 'bg-amber-100 text-amber-600',
  deal_created: 'bg-indigo-100 text-indigo-600',
  deal_won: 'bg-emerald-100 text-emerald-600',
  deal_lost: 'bg-red-100 text-red-600',
}

interface ActivityTimelineProps {
  activities: CrmActivityWithUser[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        Nenhuma atividade registrada
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = ACTIVITY_ICONS[activity.type] ?? MessageSquare
        const color = ACTIVITY_COLORS[activity.type] ?? 'bg-gray-100 text-gray-600'

        return (
          <div key={activity.id} className="flex gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {ACTIVITY_TYPE_LABELS[activity.type]}
                </span>
                {activity.user && (
                  <span className="text-xs text-muted-foreground">
                    por {activity.user.display_name}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(activity.created_at)}
                </span>
              </div>
              {activity.content && (
                <p className="text-sm text-muted-foreground">{activity.content}</p>
              )}
              {activity.type === 'stage_change' && activity.metadata && (
                <p className="text-sm text-muted-foreground">
                  {(activity.metadata as { from?: string }).from} → {(activity.metadata as { to?: string }).to}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
