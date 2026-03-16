import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { DailyBoardPDF } from '@/lib/pdf/daily-board'
import { startOfDay, endOfDay } from 'date-fns'
import React from 'react'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profileId = session.user.id
  const { searchParams } = new URL(request.url)
  const dateStr = searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  const groupBy = (searchParams.get('group_by') ?? 'court') as 'court' | 'judge'
  const date = new Date(dateStr)

  const [cases, profile] = await Promise.all([
    prisma.case.findMany({
      where: {
        profileId,
        nextDate: { gte: startOfDay(date), lte: endOfDay(date) },
      },
      select: {
        id: true,
        caseNumber: true,
        firstParty: true,
        oppositeParty: true,
        courtName: true,
        courtNo: true,
        fixedFor: true,
        judgeName: true,
        caseType: true,
      },
      orderBy: [{ courtName: 'asc' }, { caseNumber: 'asc' }],
    }),
    prisma.profile.findUnique({
      where: { id: profileId },
      select: { fullName: true, officeName: true, mobile: true, logoUrl: true },
    }),
  ])

  const pdfBuffer = await renderToBuffer(
    React.createElement(DailyBoardPDF, {
      date,
      cases,
      profile: profile ?? { fullName: null, officeName: null, mobile: null, logoUrl: null },
      groupBy,
    }) as any
  )

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="daily-board-${dateStr}.pdf"`,
    },
  })
}
