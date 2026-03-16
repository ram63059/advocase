import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { startOfDay, endOfDay, addDays } from 'date-fns'
import { CasesPageClient } from '@/components/cases/CasesPageClient'

interface SearchParams {
  filter?: string
  date?: string
  search?: string
  courtType?: string
  fixedFor?: string
  page?: string
  view?: string
  caseNumber?: string
  cnrNumber?: string
  firstParty?: string
  oppositeParty?: string
  year?: string
  nextDateFrom?: string
  nextDateTo?: string
}

interface CasesPageProps {
  searchParams: Promise<SearchParams>
}

function buildWhereClause(profileId: string, params: SearchParams) {
  const today = new Date()
  const tomorrow = addDays(today, 1)
  const base = { profileId }

  if (params.filter === 'today') {
    return { ...base, nextDate: { gte: startOfDay(today), lte: endOfDay(today) } }
  }
  if (params.filter === 'tomorrow') {
    return { ...base, nextDate: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) } }
  }
  if (params.filter === 'awaited') {
    return { ...base, nextDate: null, status: 'running' }
  }
  if (params.filter === 'decided') {
    return { ...base, status: 'decided' }
  }
  if (params.filter === 'abandoned') {
    return { ...base, status: 'abandoned' }
  }
  if (params.filter === 'important') {
    return { ...base, isImportant: true }
  }

  if (params.date) {
    const day = new Date(params.date)
    return { ...base, nextDate: { gte: startOfDay(day), lte: endOfDay(day) } }
  }

  const searchTerm = params.search
  return {
    ...base,
    ...(searchTerm && {
      OR: [
        { caseNumber: { contains: searchTerm, mode: 'insensitive' as const } },
        { cnrNumber: { contains: searchTerm, mode: 'insensitive' as const } },
        { firstParty: { contains: searchTerm, mode: 'insensitive' as const } },
        { oppositeParty: { contains: searchTerm, mode: 'insensitive' as const } },
      ]
    }),
    ...(params.courtType && { courtType: params.courtType }),
    ...(params.fixedFor && { fixedFor: params.fixedFor }),
    ...(params.caseNumber && { caseNumber: { contains: params.caseNumber, mode: 'insensitive' as const } }),
    ...(params.cnrNumber && { cnrNumber: { contains: params.cnrNumber, mode: 'insensitive' as const } }),
    ...(params.firstParty && { firstParty: { contains: params.firstParty, mode: 'insensitive' as const } }),
    ...(params.oppositeParty && { oppositeParty: { contains: params.oppositeParty, mode: 'insensitive' as const } }),
    ...(params.year && { year: parseInt(params.year) }),
  }
}

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const profileId = session.user.id

  const resolvedParams = await searchParams
  const page = Number(resolvedParams.page ?? 1)
  const limit = 25
  const skip = (page - 1) * limit

  const where = buildWhereClause(profileId, resolvedParams)

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
        createdAt: true,
      },
      orderBy: [{ nextDate: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.case.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <CasesPageClient
      cases={cases}
      total={total}
      totalPages={totalPages}
      currentPage={page}
      searchParams={resolvedParams}
    />
  )
}
