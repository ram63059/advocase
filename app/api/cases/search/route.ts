import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''

  if (q.length < 2) return NextResponse.json([])

  const cases = await prisma.case.findMany({
    where: {
      profileId: session.user.id,
      OR: [
        { caseNumber: { contains: q, mode: 'insensitive' } },
        { firstParty: { contains: q, mode: 'insensitive' } },
        { oppositeParty: { contains: q, mode: 'insensitive' } },
        { cnrNumber: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, caseNumber: true, firstParty: true, oppositeParty: true, courtName: true },
    take: 10,
    orderBy: { nextDate: 'asc' },
  })

  return NextResponse.json(cases)
}
