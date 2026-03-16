import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { TeamPageClient } from '@/components/admin/TeamPageClient'

export default async function TeamPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const teamMembers = await prisma.teamMember.findMany({
    where: { ownerId: session.user.id },
    orderBy: { invitedAt: 'desc' },
  })

  return <TeamPageClient teamMembers={teamMembers} ownerId={session.user.id} />
}
