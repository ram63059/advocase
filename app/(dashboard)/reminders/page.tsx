import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { RemindersPageClient } from '@/components/reminders/RemindersPageClient'

export default async function RemindersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const reminders = await prisma.reminder.findMany({
    where: { profileId: session.user.id },
    include: {
      case: { select: { id: true, caseNumber: true, firstParty: true } },
      client: { select: { id: true, fullName: true } },
    },
    orderBy: [{ isActive: 'desc' }, { startDate: 'asc' }],
  })

  return <RemindersPageClient reminders={reminders} />
}
