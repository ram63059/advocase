import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profileId = session.user.id
  const { searchParams } = new URL(request.url)

  const q = searchParams.get('q') ?? ''
  const caseNumber = searchParams.get('caseNumber') ?? ''
  const cnrNumber = searchParams.get('cnrNumber') ?? ''
  const courtType = searchParams.get('courtType') ?? ''
  const firstParty = searchParams.get('firstParty') ?? ''
  const oppositeParty = searchParams.get('oppositeParty') ?? ''
  const fixedFor = searchParams.get('fixedFor') ?? ''
  const nextDateFrom = searchParams.get('nextDateFrom') ?? ''
  const nextDateTo = searchParams.get('nextDateTo') ?? ''
  const year = searchParams.get('year') ?? ''
  const includeDecided = searchParams.get('includeDecided') === 'true'
  const onlyDecided = searchParams.get('onlyDecided') === 'true'
  const onlyAwaited = searchParams.get('onlyAwaited') === 'true'

  // Build status filter
  let statusFilter: any = undefined
  if (onlyDecided) {
    statusFilter = 'decided'
  } else if (!includeDecided && !onlyAwaited) {
    statusFilter = { in: ['running', 'abandoned'] }
  }

  const where: any = {
    profileId,
    ...(statusFilter !== undefined && { status: statusFilter }),
    ...(onlyAwaited && { nextDate: null }),
    ...(courtType && { courtType }),
    ...(fixedFor && { fixedFor }),
    ...(year && { year: parseInt(year) }),
  }

  // Date range
  if (nextDateFrom && nextDateTo) {
    where.nextDate = {
      gte: startOfDay(new Date(nextDateFrom)),
      lte: endOfDay(new Date(nextDateTo)),
    }
  } else if (nextDateFrom) {
    where.nextDate = { gte: startOfDay(new Date(nextDateFrom)) }
  } else if (nextDateTo) {
    where.nextDate = { lte: endOfDay(new Date(nextDateTo)) }
  }

  // Text search conditions
  const searchConditions: any[] = []

  if (q) {
    searchConditions.push(
      { caseNumber: { contains: q, mode: 'insensitive' } },
      { cnrNumber: { contains: q, mode: 'insensitive' } },
      { firstParty: { contains: q, mode: 'insensitive' } },
      { oppositeParty: { contains: q, mode: 'insensitive' } },
      { referenceNo: { contains: q, mode: 'insensitive' } }
    )
  }
  if (caseNumber) searchConditions.push({ caseNumber: { contains: caseNumber, mode: 'insensitive' } })
  if (cnrNumber) searchConditions.push({ cnrNumber: { contains: cnrNumber, mode: 'insensitive' } })
  if (firstParty) searchConditions.push({ firstParty: { contains: firstParty, mode: 'insensitive' } })
  if (oppositeParty) searchConditions.push({ oppositeParty: { contains: oppositeParty, mode: 'insensitive' } })

  if (searchConditions.length > 0) {
    where.OR = searchConditions
  }

  const [cases, total] = await Promise.all([
    prisma.case.findMany({
      where,
      select: {
        id: true,
        caseNumber: true,
        cnrNumber: true,
        firstParty: true,
        oppositeParty: true,
        courtName: true,
        courtType: true,
        nextDate: true,
        fixedFor: true,
        status: true,
        isImportant: true,
        caseType: true,
        year: true,
      },
      orderBy: [{ nextDate: 'asc' }, { firstParty: 'asc' }],
      take: 100,
    }),
    prisma.case.count({ where }),
  ])

  return NextResponse.json({ cases, total })
}
