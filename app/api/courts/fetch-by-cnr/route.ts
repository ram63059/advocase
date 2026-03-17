import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { fetchCaseByCNR } from '@/lib/ecourts/district'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  try {
    const { cnr, caseId } = await request.json()
    if (!cnr) return NextResponse.json({ error: 'CNR required' }, { status: 400 })

    const caseData = await fetchCaseByCNR(cnr.trim().toUpperCase())
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found on eCourts. Check server logs for the raw eCourts API response.' }, { status: 404 })
    }

    // If caseId provided, update existing case + create history records
    if (caseId) {
      const existing = await prisma.case.findFirst({
        where: { id: caseId, profileId: userId },
      })

      if (existing && caseData.history?.length) {
        for (const h of caseData.history) {
          if (!h.hearingDate) continue
          // Check if a history entry already exists for this hearing date
          const existingHistory = await prisma.caseHistory.findFirst({
            where: { caseId, hearingDate: h.hearingDate },
          })
          if (existingHistory) {
            await prisma.caseHistory.update({
              where: { id: existingHistory.id },
              data: { judge: h.judge, purpose: h.purpose },
            })
          } else {
            await prisma.caseHistory.create({
              data: {
                caseId,
                judge: h.judge,
                businessOnDate: h.businessOnDate,
                hearingDate: h.hearingDate,
                purpose: h.purpose,
              },
            })
          }
        }

        await prisma.case.update({
          where: { id: caseId },
          data: {
            nextDate: caseData.nextDate,
            fixedFor: caseData.fixedFor,
            previousDate: caseData.previousDate,
            judgeName: caseData.judgeName ?? existing.judgeName,
            lastSyncedAt: new Date(),
          },
        })
      }
    }

    return NextResponse.json({
      caseNumber: caseData.caseNumber,
      cnrNumber: cnr,
      year: caseData.year,
      courtName: caseData.courtName,
      courtNo: caseData.courtNo,
      judgeName: caseData.judgeName,
      firstParty: caseData.firstParty,
      oppositeParty: caseData.oppositeParty,
      nextDate: caseData.nextDate?.toISOString().split('T')[0] ?? null,
      fixedFor: caseData.fixedFor,
      previousDate: caseData.previousDate?.toISOString().split('T')[0] ?? null,
      filingDate: caseData.filingDate?.toISOString().split('T')[0] ?? null,
    })
  } catch (error) {
    console.error('[POST fetch-by-cnr]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
