'use client'
import { useRouter } from 'next/navigation'
import { Briefcase, CalendarDays, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardStatsProps {
  stats: {
    total: number
    today: number
    tomorrow: number
    awaited: number
    decided: number
  }
}

const statCards = [
  {
    key: 'total' as const,
    label: 'All Cases',
    icon: Briefcase,
    href: '/cases',
  },
  {
    key: 'today' as const,
    label: "Today's Hearings",
    icon: CalendarDays,
    href: '/cases?filter=today',
  },
  {
    key: 'tomorrow' as const,
    label: 'Tomorrow',
    icon: Clock,
    href: '/cases?filter=tomorrow',
  },
  {
    key: 'awaited' as const,
    label: 'Date Awaited',
    icon: AlertCircle,
    href: '/cases?filter=awaited',
  },
  {
    key: 'decided' as const,
    label: 'Decided',
    icon: CheckCircle,
    href: '/cases?filter=decided',
  },
]

export function DashboardStats({ stats }: DashboardStatsProps) {
  const router = useRouter()

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {statCards.map((card) => (
        <button
          key={card.key}
          onClick={() => router.push(card.href)}
          className={cn(
            'p-4 rounded-xl border border-border bg-card text-left',
            'hover:bg-secondary transition-all cursor-pointer group'
          )}
        >
          <card.icon size={16} className="text-muted-foreground mb-3 group-hover:text-foreground transition-colors" />
          <p className="text-2xl font-semibold text-foreground">{stats[card.key]}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-tight">{card.label}</p>
        </button>
      ))}
    </div>
  )
}
