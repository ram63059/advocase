import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profileId = session.user.id
  const { searchParams } = new URL(request.url)

  const q = searchParams.get('q') ?? ''
  const courtType = searchParams.get('courtType') ?? ''
  const fixedFor = searchParams.get('fixedFor') ?? ''
  const nextDateFrom = searchParams.get('nextDateFrom') ?? ''
  const nextDateTo = searchParams.get('nextDateTo') ?? ''
  const onlyDecided = searchParams.get('onlyDecided') === 'true'
  const includeDecided = searchParams.get('includeDecided') === 'true'

  const where: any = {
    profileId,
    ...(courtType && { courtType }),
    ...(fixedFor && { fixedFor }),
    ...(!onlyDecided && !includeDecided && { status: { in: ['running', 'abandoned'] } }),
    ...(onlyDecided && { status: 'decided' }),
  }

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

  if (q) {
    where.OR = [
      { caseNumber: { contains: q, mode: 'insensitive' } },
      { firstParty: { contains: q, mode: 'insensitive' } },
      { oppositeParty: { contains: q, mode: 'insensitive' } },
      { cnrNumber: { contains: q, mode: 'insensitive' } },
    ]
  }

  const cases = await prisma.case.findMany({
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
      caseType: true,
      year: true,
      judgeName: true,
      underSection: true,
    },
    orderBy: [{ nextDate: 'asc' }, { firstParty: 'asc' }],
    take: 5000, // safety limit
  })

  const data = cases.map((c, i) => ({
    'S.No': i + 1,
    'Case Number': c.caseNumber ?? '',
    'CNR': c.cnrNumber ?? '',
    'First Party': c.firstParty ?? '',
    'Opposite Party': c.oppositeParty ?? '',
    'Court': c.courtName ?? '',
    'Court Type': c.courtType ?? '',
    'Next Date': c.nextDate ? format(new Date(c.nextDate), 'dd/MM/yyyy') : 'Awaited',
    'Fixed For': c.fixedFor ?? '',
    'Status': c.status,
    'Case Type': c.caseType ?? '',
    'Year': c.year ?? '',
    'Judge': c.judgeName ?? '',
    'Under Section': c.underSection ?? '',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Cases')

  // Set column widths
  ws['!cols'] = [
    { width: 5 },  // S.No
    { width: 20 }, // Case Number
    { width: 20 }, // CNR
    { width: 30 }, // First Party
    { width: 30 }, // Opposite Party
    { width: 25 }, // Court
    { width: 12 }, // Court Type
    { width: 12 }, // Next Date
    { width: 18 }, // Fixed For
    { width: 10 }, // Status
    { width: 15 }, // Case Type
    { width: 6 },  // Year
    { width: 20 }, // Judge
    { width: 20 }, // Under Section
  ]

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const dateTag = format(new Date(), 'yyyy-MM-dd')
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="cases-${dateTag}.xlsx"`,
    },
  })
}
