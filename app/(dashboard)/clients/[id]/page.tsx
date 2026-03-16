import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { ClientDetailClient } from '@/components/clients/ClientDetailClient'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const client = await prisma.client.findUnique({
    where: { id, profileId: session.user.id },
    include: {
      cases: {
        include: {
          case: {
            select: {
              id: true,
              caseNumber: true,
              firstParty: true,
              oppositeParty: true,
              courtName: true,
              nextDate: true,
              fixedFor: true,
              status: true,
              caseType: true,
            },
          },
        },
        orderBy: { case: { nextDate: 'asc' } },
      },
      fees: {
        include: {
          case: { select: { id: true, caseNumber: true } },
        },
        orderBy: { feeDate: 'desc' },
      },
    },
  })

  if (!client) notFound()

  return <ClientDetailClient client={client} />
}
