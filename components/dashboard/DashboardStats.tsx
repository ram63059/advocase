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
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    iconColor: 'text-blue-500',
  },
  {
    key: 'today' as const,
    label: "Today's Hearings",
    icon: CalendarDays,
    href: '/cases?filter=today',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    iconColor: 'text-amber-500',
  },
  {
    key: 'tomorrow' as const,
    label: 'Tomorrow',
    icon: Clock,
    href: '/cases?filter=tomorrow',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    iconColor: 'text-orange-500',
  },
  {
    key: 'awaited' as const,
    label: 'Date Awaited',
    icon: AlertCircle,
    href: '/cases?filter=awaited',
    bg: 'bg-red-50',
    text: 'text-red-700',
    iconColor: 'text-red-500',
  },
  {
    key: 'decided' as const,
    label: 'Decided',
    icon: CheckCircle,
    href: '/cases?filter=decided',
    bg: 'bg-green-50',
    text: 'text-green-700',
    iconColor: 'text-green-500',
  },
]

export function DashboardStats({ stats }: DashboardStatsProps) {
  const router = useRouter()

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statCards.map((card) => (
        <button
          key={card.key}
          onClick={() => router.push(card.href)}
          className={cn(
            'p-4 rounded-lg border border-slate-200 bg-white text-left',
            'hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer'
          )}
        >
          <div className={cn('inline-flex p-2 rounded-md mb-3', card.bg)}>
            <card.icon size={18} className={card.iconColor} />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats[card.key]}</p>
          <p className="text-xs text-slate-500 mt-1">{card.label}</p>
        </button>
      ))}
    </div>
  )
}
