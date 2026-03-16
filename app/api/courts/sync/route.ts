import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { fetchAdvocateCases } from '@/lib/ecourts/district'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  let courtId: string | null = null

  try {
    const body = await request.json()
    courtId = body.court_id ?? null

    if (!courtId) return NextResponse.json({ error: 'court_id required' }, { status: 400 })

    const court = await prisma.courtRegistered.findUnique({
      where: { id: courtId, profileId: userId },
    })
    if (!court) return NextResponse.json({ error: 'Court not found' }, { status: 404 })

    // Mark as syncing
    await prisma.courtRegistered.update({
      where: { id: courtId },
      data: { syncStatus: 'syncing' },
    })

    // Fetch cases from eCourts
    const eCourtsCase = await fetchAdvocateCases({
      stateCode: court.stateCode ?? '',
      advocateName: court.advocateName ?? '',
    })

    let updatedCount = 0
    for (const ec of eCourtsCase) {
      if (!ec.cnrNumber) continue

      const existing = await prisma.case.findFirst({
        where: { profileId: userId, cnrNumber: ec.cnrNumber },
      })

      if (existing) {
        await prisma.case.update({
          where: { id: existing.id },
          data: {
            nextDate: ec.nextDate,
            fixedFor: ec.fixedFor,
            previousDate: ec.nextDate ? existing.nextDate : existing.previousDate,
            courtNo: ec.courtNo ?? existing.courtNo,
            judgeName: ec.judgeName ?? existing.judgeName,
            lastSyncedAt: new Date(),
          },
        })
        updatedCount++
      }
    }

    // Mark sync complete
    await prisma.courtRegistered.update({
      where: { id: courtId },
      data: { syncStatus: 'done', lastSyncedAt: new Date() },
    })

    return NextResponse.json({ success: true, updated: updatedCount })
  } catch (error) {
    console.error('[POST courts/sync]', error)
    if (courtId) {
      await prisma.courtRegistered.update({
        where: { id: courtId },
        data: { syncStatus: 'error' },
      }).catch(() => {})
    }
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
