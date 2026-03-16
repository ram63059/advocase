import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profileId = session.user.id

  const [profile, cases, clients, tasks, reminders] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true, fullName: true, email: true, officeName: true,
        officeAddress: true, mobile: true, plan: true, createdAt: true,
      },
    }),
    prisma.case.findMany({
      where: { profileId },
      include: {
        history: true,
        fees: true,
        notes: true,
      },
    }),
    prisma.client.findMany({
      where: { profileId },
      include: { fees: true },
    }),
    prisma.task.findMany({ where: { profileId } }),
    prisma.reminder.findMany({ where: { profileId } }),
  ])

  const data = {
    exportedAt: new Date().toISOString(),
    profile,
    cases,
    clients,
    tasks,
    reminders,
  }

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="advocase-data-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
