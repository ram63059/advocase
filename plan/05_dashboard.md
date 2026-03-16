# Stage 5: Dashboard Page

## Goal
Build the main dashboard (`/`) with stats, today's hearings, 7-day strip, purpose chart, quick actions, and registered courts overview.

---

## File: `app/(dashboard)/page.tsx`

This is a **Server Component** — all data fetched server-side.

```typescript
// app/(dashboard)/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { startOfDay, endOfDay, addDays, format } from 'date-fns'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { TodayHearings } from '@/components/dashboard/TodayHearings'
import { SevenDayStrip } from '@/components/dashboard/SevenDayStrip'
import { PurposeChart } from '@/components/dashboard/PurposeChart'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RegisteredCourts } from '@/components/dashboard/RegisteredCourts'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.userId

  const profileId = userId
  const today = new Date()
  const tomorrow = addDays(today, 1)

  // Fetch all dashboard data in parallel
  const [
    totalRunning,
    todayCases,
    tomorrowCount,
    awaitedCount,
    decidedCount,
    todayHearings,
    sevenDayCounts,
    purposeBreakdown,
    registeredCourts,
  ] = await Promise.all([
    // Total running cases
    prisma.case.count({
      where: { profileId, status: 'running' }
    }),

    // Today's hearings
    prisma.case.findMany({
      where: {
        profileId,
        nextDate: { gte: startOfDay(today), lte: endOfDay(today) }
      },
      select: {
        id: true, caseNumber: true, cnrNumber: true,
        firstParty: true, oppositeParty: true,
        courtName: true, fixedFor: true, courtType: true,
      },
      orderBy: { courtName: 'asc' },
      take: 10,
    }),

    // Tomorrow count
    prisma.case.count({
      where: {
        profileId,
        nextDate: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) }
      }
    }),

    // Date awaited (no next date, running)
    prisma.case.count({
      where: { profileId, nextDate: null, status: 'running' }
    }),

    // Decided
    prisma.case.count({
      where: { profileId, status: 'decided' }
    }),

    // Today's hearing list (same as todayCases but used differently)
    prisma.case.findMany({
      where: {
        profileId,
        nextDate: { gte: startOfDay(today), lte: endOfDay(today) }
      },
      select: {
        id: true, caseNumber: true, cnrNumber: true,
        firstParty: true, oppositeParty: true,
        courtName: true, fixedFor: true, status: true, courtType: true,
      },
      orderBy: { courtName: 'asc' },
    }),

    // 7-day counts (D0 to D6)
    Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const day = addDays(today, i)
        return prisma.case.count({
          where: {
            profileId,
            nextDate: { gte: startOfDay(day), lte: endOfDay(day) }
          }
        }).then(count => ({ date: day, count }))
      })
    ),

    // Purpose breakdown (Fixed For grouping)
    prisma.case.groupBy({
      by: ['fixedFor'],
      where: { profileId, status: 'running', fixedFor: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    }),

    // Registered courts
    prisma.courtRegistered.findMany({
      where: { profileId },
      orderBy: { lastSyncedAt: 'desc' },
    }),
  ])

  const stats = {
    total: totalRunning,
    today: todayCases.length,
    tomorrow: tomorrowCount,
    awaited: awaitedCount,
    decided: decidedCount,
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Good {getGreeting()}, {user.email?.split('@')[0]}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {format(today, 'EEEE, dd MMMM yyyy')}
        </p>
      </div>

      {/* Stats row */}
      <DashboardStats stats={stats} />

      {/* Today's hearings */}
      <TodayHearings cases={todayHearings} />

      {/* 7-day strip + purpose chart (2 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SevenDayStrip days={sevenDayCounts} />
        <PurposeChart data={purposeBreakdown.map(p => ({
          label: p.fixedFor ?? 'Unknown',
          count: p._count.id
        }))} />
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Registered courts */}
      <RegisteredCourts courts={registeredCourts} />
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
```

---

## Component: `components/dashboard/DashboardStats.tsx`

```typescript
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
    color: 'blue',
    href: '/cases',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    iconColor: 'text-blue-500',
  },
  {
    key: 'today' as const,
    label: "Today's Hearings",
    icon: CalendarDays,
    color: 'amber',
    href: '/cases?filter=today',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    iconColor: 'text-amber-500',
  },
  {
    key: 'tomorrow' as const,
    label: 'Tomorrow',
    icon: Clock,
    color: 'orange',
    href: '/cases?filter=tomorrow',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    iconColor: 'text-orange-500',
  },
  {
    key: 'awaited' as const,
    label: 'Date Awaited',
    icon: AlertCircle,
    color: 'red',
    href: '/cases?filter=awaited',
    bg: 'bg-red-50',
    text: 'text-red-700',
    iconColor: 'text-red-500',
  },
  {
    key: 'decided' as const,
    label: 'Decided',
    icon: CheckCircle,
    color: 'green',
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
```

---

## Component: `components/dashboard/TodayHearings.tsx`

```typescript
'use client'
import Link from 'next/link'
import { CalendarDays, ArrowRight } from 'lucide-react'
import { CaseStatusBadge } from '@/components/cases/CaseStatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'

interface TodayCase {
  id: string
  caseNumber: string | null
  firstParty: string | null
  oppositeParty: string | null
  courtName: string | null
  fixedFor: string | null
  status: string
  courtType: string | null
}

export function TodayHearings({ cases }: { cases: TodayCase[] }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-indigo-600" />
          <h2 className="font-semibold text-slate-900">Today's Hearings</h2>
          {cases.length > 0 && (
            <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {cases.length}
            </span>
          )}
        </div>
        <Link
          href="/cases?filter=today"
          className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      {cases.length === 0 ? (
        <div className="py-10">
          <EmptyState
            icon={CalendarDays}
            title="No hearings today"
            description="You have no cases scheduled for today."
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {cases.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-slate-700">{c.caseNumber ?? 'No Number'}</span>
                  {c.fixedFor && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {c.fixedFor}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-900 mt-0.5 truncate">
                  {c.firstParty} <span className="text-slate-400">vs</span> {c.oppositeParty}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{c.courtName}</p>
              </div>
              <ArrowRight size={14} className="text-slate-400 shrink-0 ml-4" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## Component: `components/dashboard/SevenDayStrip.tsx`

```typescript
'use client'
import Link from 'next/link'
import { format, isToday } from 'date-fns'
import { cn } from '@/lib/utils'

interface DayCount { date: Date; count: number }

export function SevenDayStrip({ days }: { days: DayCount[] }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-900 mb-4">Next 7 Days</h2>
      <div className="grid grid-cols-7 gap-2">
        {days.map(({ date, count }, i) => {
          const today = isToday(date)
          const dateStr = format(date, 'yyyy-MM-dd')
          return (
            <Link
              key={i}
              href={`/cases?date=${dateStr}`}
              className={cn(
                'flex flex-col items-center p-2 rounded-lg transition-colors',
                today ? 'bg-indigo-600' : count > 0 ? 'bg-indigo-50 hover:bg-indigo-100' : 'bg-slate-50 hover:bg-slate-100'
              )}
            >
              <span className={cn('text-xs font-medium', today ? 'text-indigo-200' : 'text-slate-500')}>
                {format(date, 'EEE')}
              </span>
              <span className={cn('text-lg font-bold mt-0.5', today ? 'text-white' : 'text-slate-900')}>
                {format(date, 'd')}
              </span>
              {count > 0 && (
                <span className={cn(
                  'text-xs font-medium mt-1 w-5 h-5 rounded-full flex items-center justify-center',
                  today ? 'bg-indigo-500 text-white' : 'bg-indigo-600 text-white'
                )}>
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

---

## Component: `components/dashboard/PurposeChart.tsx`

```typescript
'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface PurposeData { label: string; count: number }

const CHART_COLORS = ['#4F46E5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#f0f4ff', '#f8fafc']

export function PurposeChart({ data }: { data: PurposeData[] }) {
  if (data.length === 0) return null

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-900 mb-4">Cases by Purpose</h2>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={130}
            tick={{ fontSize: 12, fill: '#64748B' }}
          />
          <Tooltip
            formatter={(value) => [value, 'Cases']}
            contentStyle={{ border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

---

## Component: `components/dashboard/QuickActions.tsx`

```typescript
'use client'
import Link from 'next/link'
import { Plus, Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild>
        <Link href="/cases/new">
          <Plus size={16} className="mr-2" />
          Add Case
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/cases/new?import=ecourts">
          <Download size={16} className="mr-2" />
          Import from eCourts
        </Link>
      </Button>
      <Button variant="outline" onClick={() => {
        // Trigger daily board PDF generation
        window.open(`/api/export/daily-board?date=${new Date().toISOString().split('T')[0]}`, '_blank')
      }}>
        <FileText size={16} className="mr-2" />
        Get Daily Board
      </Button>
    </div>
  )
}
```

---

## Component: `components/dashboard/RegisteredCourts.tsx`

```typescript
'use client'
import { RefreshCw, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

interface CourtRegisteredItem {
  id: string
  courtType: string
  courtComplex: string | null
  establishment: string | null
  state: string | null
  lastSyncedAt: Date | null
  syncStatus: string
}

export function RegisteredCourts({ courts }: { courts: CourtRegisteredItem[] }) {
  const [syncing, setSyncing] = useState<string | null>(null)

  const handleSync = async (courtId: string) => {
    setSyncing(courtId)
    try {
      const res = await fetch('/api/courts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ court_id: courtId }),
      })
      if (!res.ok) throw new Error('Sync failed')
      toast.success('Sync started! Cases will update shortly.')
    } catch {
      toast.error('Sync failed. Please try again.')
    } finally {
      setSyncing(null)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Registered Courts</h2>
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings#courts">
            <Plus size={14} className="mr-1" />
            Add Court
          </Link>
        </Button>
      </div>

      {courts.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-slate-500">No courts registered yet.</p>
          <Button size="sm" className="mt-3" asChild>
            <Link href="/settings#courts">Register a court for auto-sync</Link>
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {courts.map((court) => (
            <div key={court.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {court.establishment ?? court.courtComplex ?? court.courtType}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {court.state} • Last synced: {court.lastSyncedAt ? formatDate(court.lastSyncedAt) : 'Never'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSync(court.id)}
                disabled={syncing === court.id}
                className="gap-1 text-slate-600"
              >
                <RefreshCw size={14} className={syncing === court.id ? 'animate-spin' : ''} />
                {syncing === court.id ? 'Syncing…' : 'Sync'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## Realtime Updates (Supabase)

Add this to the dashboard shell to refresh stats when cases update:

```typescript
// In DashboardShell.tsx or a separate 'use client' hook
// Requires NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
// (Supabase Realtime uses anon key — only for live updates, not auth)
'use client'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const supabaseRealtime = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function useRealtimeCaseUpdates() {
  const router = useRouter()
  const supabase = supabaseRealtime

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-cases')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cases' },
        () => {
          router.refresh()  // Re-run server component data fetching
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])
}
```

---

## Verification Checklist
- [ ] All 5 stat cards show correct counts
- [ ] Today's hearings list is accurate and links to case detail
- [ ] 7-day strip highlights today with indigo background
- [ ] Clicking a day in 7-day strip navigates to filtered cases
- [ ] Purpose chart renders when there are cases with fixedFor values
- [ ] Quick actions buttons navigate correctly
- [ ] Registered courts table shows sync button
- [ ] Sync button calls `/api/courts/sync` and shows toast
- [ ] Greeting changes based on time of day
- [ ] Page loads in under 2 seconds (all server-side)
