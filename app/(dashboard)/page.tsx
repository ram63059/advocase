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

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const profileId = session.user.id

  const today = new Date()
  const tomorrow = addDays(today, 1)

  const [
    totalRunning,
    todayCases,
    tomorrowCount,
    awaitedCount,
    decidedCount,
    sevenDayCounts,
    purposeBreakdown,
    registeredCourts,
  ] = await Promise.all([
    prisma.case.count({
      where: { profileId, status: 'running' }
    }),

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

    prisma.case.count({
      where: {
        profileId,
        nextDate: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) }
      }
    }),

    prisma.case.count({
      where: { profileId, nextDate: null, status: 'running' }
    }),

    prisma.case.count({
      where: { profileId, status: 'decided' }
    }),

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

    prisma.case.groupBy({
      by: ['fixedFor'],
      where: { profileId, status: 'running', fixedFor: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    }),

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

  const userName = session.user.name ?? session.user.email?.split('@')[0] ?? 'Advocate'

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Good {getGreeting()}, {userName}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(today, 'EEEE, dd MMMM yyyy')}
        </p>
      </div>

      {/* Stats row */}
      <DashboardStats stats={stats} />

      {/* Quick actions */}
      <QuickActions />

      {/* Today's hearings */}
      <TodayHearings cases={todayCases} />

      {/* 7-day strip + purpose chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SevenDayStrip days={sevenDayCounts} />
        <PurposeChart data={purposeBreakdown.map(p => ({
          label: p.fixedFor ?? 'Unknown',
          count: p._count.id
        }))} />
      </div>

      {/* Registered courts */}
      <RegisteredCourts courts={registeredCourts} />
    </div>
  )
}
