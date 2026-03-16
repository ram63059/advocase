import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { pdfStyles } from '@/lib/pdf/styles'
import { format, startOfDay, endOfDay } from 'date-fns'
import React from 'react'

function truncate(str: string, n: number) {
  return str && str.length > n ? str.slice(0, n - 1) + '...' : (str ?? '')
}

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

  const [cases, profile] = await Promise.all([
    prisma.case.findMany({
      where,
      select: {
        id: true, caseNumber: true, cnrNumber: true,
        firstParty: true, oppositeParty: true,
        courtName: true, courtType: true,
        nextDate: true, fixedFor: true, status: true, caseType: true,
      },
      orderBy: [{ courtType: 'asc' }, { nextDate: 'asc' }],
      take: 1000,
    }),
    prisma.profile.findUnique({
      where: { id: profileId },
      select: { fullName: true, officeName: true },
    }),
  ])

  const CasesListPDF = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: pdfStyles.page, orientation: 'landscape' },
      // Header
      React.createElement(
        View,
        { style: pdfStyles.header },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: pdfStyles.officeName },
            profile?.officeName ?? profile?.fullName ?? 'Advocase'
          ),
          React.createElement(Text, { style: { fontSize: 9, color: '#64748B' } },
            `Cases List • Generated ${format(new Date(), 'dd MMM yyyy')}`
          )
        ),
        React.createElement(
          View,
          { style: { alignItems: 'flex-end' } },
          React.createElement(Text, { style: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#4F46E5' } },
            'Cases Report'
          ),
          React.createElement(Text, { style: { fontSize: 9, color: '#94A3B8' } },
            `${cases.length} cases`
          )
        )
      ),
      // Table header
      React.createElement(
        View,
        { style: pdfStyles.tableHeader },
        React.createElement(Text, { style: [pdfStyles.tableHeaderCell, { width: '5%' }] }, '#'),
        React.createElement(Text, { style: [pdfStyles.tableHeaderCell, { width: '14%' }] }, 'Case No.'),
        React.createElement(Text, { style: [pdfStyles.tableHeaderCell, { width: '22%' }] }, 'First Party'),
        React.createElement(Text, { style: [pdfStyles.tableHeaderCell, { width: '22%' }] }, 'Opposite Party'),
        React.createElement(Text, { style: [pdfStyles.tableHeaderCell, { width: '18%' }] }, 'Court'),
        React.createElement(Text, { style: [pdfStyles.tableHeaderCell, { width: '10%' }] }, 'Next Date'),
        React.createElement(Text, { style: [pdfStyles.tableHeaderCell, { width: '9%' }] }, 'Status'),
      ),
      // Table rows
      ...cases.map((c, i) =>
        React.createElement(
          View,
          {
            key: c.id,
            style: [pdfStyles.tableRow, i % 2 !== 0 ? { backgroundColor: '#FAFAFA' } : {}],
          },
          React.createElement(Text, { style: [pdfStyles.tableCell, { width: '5%' }] }, String(i + 1)),
          React.createElement(Text, { style: [pdfStyles.tableCell, { width: '14%', fontFamily: 'Courier', fontSize: 8 }] },
            c.caseNumber ?? '—'
          ),
          React.createElement(Text, { style: [pdfStyles.tableCell, { width: '22%', fontSize: 8 }] },
            truncate(c.firstParty ?? '—', 30)
          ),
          React.createElement(Text, { style: [pdfStyles.tableCell, { width: '22%', fontSize: 8 }] },
            truncate(c.oppositeParty ?? '—', 30)
          ),
          React.createElement(Text, { style: [pdfStyles.tableCell, { width: '18%', fontSize: 8 }] },
            truncate(c.courtName ?? '—', 25)
          ),
          React.createElement(Text, { style: [pdfStyles.tableCell, { width: '10%', fontSize: 8 }] },
            c.nextDate ? format(new Date(c.nextDate), 'dd/MM/yy') : 'Awaited'
          ),
          React.createElement(Text, {
            style: [pdfStyles.tableCell, {
              width: '9%', fontSize: 8,
              color: c.status === 'decided' ? '#16a34a' : c.status === 'abandoned' ? '#dc2626' : '#2563eb',
            }],
          }, c.status)
        )
      ),
      // Footer
      React.createElement(
        View,
        { style: pdfStyles.footer, fixed: true },
        React.createElement(Text, null, `Advocase — ${format(new Date(), 'dd MMM yyyy HH:mm')}`),
        React.createElement(Text, {
          render: ({ pageNumber, totalPages }: any) => `Page ${pageNumber} of ${totalPages}`,
        })
      )
    )
  )

  const pdfBuffer = await renderToBuffer(CasesListPDF)

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cases-${format(new Date(), 'yyyy-MM-dd')}.pdf"`,
    },
  })
}
