import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { TasksPageClient } from '@/components/tasks/TasksPageClient'

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const profileId = session.user.id
  const sp = await searchParams

  const [tasks, teamMembers] = await Promise.all([
    prisma.task.findMany({
      where: { profileId },
      include: {
        case: { select: { id: true, caseNumber: true, firstParty: true } },
        client: { select: { id: true, fullName: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    }),
    prisma.teamMember.findMany({
      where: { ownerId: profileId, isActive: true },
      select: { id: true, fullName: true, userId: true },
    }),
  ])

  const grouped = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  }

  return (
    <TasksPageClient
      grouped={grouped}
      teamMembers={teamMembers}
      showNewForm={sp.new === '1'}
    />
  )
}
