import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { CaseDetailClient } from '@/components/cases/CaseDetailClient'

interface CaseDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const profileId = session.user.id

  const { id } = await params

  const caseData = await prisma.case.findUnique({
    where: { id, profileId },
    include: {
      history: { orderBy: { hearingDate: 'desc' } },
      orders: { orderBy: { orderDate: 'desc' } },
      notes: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      clients: { include: { client: true } },
      oppositeCouns: true,
      fees: { orderBy: { feeDate: 'desc' } },
      reminders: { where: { isActive: true }, orderBy: { startDate: 'asc' } },
      linkedFrom: {
        include: {
          linkedCase: {
            select: { id: true, caseNumber: true, firstParty: true, oppositeParty: true, status: true }
          }
        }
      },
      linkedTo: {
        include: {
          case: {
            select: { id: true, caseNumber: true, firstParty: true, oppositeParty: true, status: true }
          }
        }
      },
    }
  })

  if (!caseData) notFound()

  return <CaseDetailClient caseData={caseData} profileId={profileId} />
}
