import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CalendarView } from '@/components/calendar/CalendarView'
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'

interface CalendarPageProps {
  searchParams: Promise<{
    year?: string
    month?: string
    courtType?: string
    fixedFor?: string
  }>
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const profileId = session.user.id
  const sp = await searchParams
  const now = new Date()
  const year = Number(sp.year ?? now.getFullYear())
  const month = Number(sp.month ?? now.getMonth())
  const currentMonth = new Date(year, month, 1)

  // Load 3 months around current for smooth navigation
  const rangeStart = startOfMonth(subMonths(currentMonth, 1))
  const rangeEnd = endOfMonth(addMonths(currentMonth, 1))

  const [cases, colorCodes] = await Promise.all([
    prisma.case.findMany({
      where: {
        profileId,
        nextDate: { gte: rangeStart, lte: rangeEnd },
        status: { not: 'abandoned' },
        ...(sp.courtType && { courtType: sp.courtType }),
        ...(sp.fixedFor && { fixedFor: sp.fixedFor }),
      },
      select: {
        id: true,
        caseNumber: true,
        firstParty: true,
        oppositeParty: true,
        courtName: true,
        courtType: true,
        nextDate: true,
        fixedFor: true,
        status: true,
      },
    }),
    prisma.colorCode.findMany({
      where: { profileId },
    }),
  ])

  // Build color map: fixedFor label -> hex color
  const colorMap = Object.fromEntries(colorCodes.map(cc => [cc.label, cc.color]))

  // Convert cases to calendar events
  const events = cases.map(c => ({
    id: c.id,
    title: `${c.caseNumber ?? '—'} • ${c.firstParty ?? ''}`,
    start: new Date(c.nextDate!),
    end: new Date(c.nextDate!),
    resource: c,
    color: colorMap[c.fixedFor ?? ''] ?? '#4F46E5',
  }))

  return (
    <CalendarView
      events={events}
      colorCodes={colorCodes}
      profileId={profileId}
      searchParams={sp}
    />
  )
}
