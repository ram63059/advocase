import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { fetchAdvocateCases } from '@/lib/ecourts/district'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { courtsProcessed: 0, casesUpdated: 0, remindersTriggered: 0 }

  try {
    // ── 1. Sync registered courts that haven't been synced in 3+ hours ──
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
    const courts = await prisma.courtRegistered.findMany({
      where: {
        syncStatus: { not: 'syncing' },
        OR: [
          { lastSyncedAt: null },
          { lastSyncedAt: { lte: threeHoursAgo } },
        ],
      },
      include: { profile: { select: { id: true } } },
      take: 20, // limit per cron run to avoid timeout
    })

    for (const court of courts) {
      try {
        await prisma.courtRegistered.update({
          where: { id: court.id },
          data: { syncStatus: 'syncing' },
        })

        const eCases = await fetchAdvocateCases({
          stateCode: (court as any).stateCode ?? '',
          advocateName: (court as any).advocateName ?? '',
        })

        let updated = 0
        for (const ec of eCases) {
          if (!ec.cnrNumber) continue
          const existing = await prisma.case.findFirst({
            where: { profileId: court.profile.id, cnrNumber: ec.cnrNumber },
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
            updated++
          }
        }

        await prisma.courtRegistered.update({
          where: { id: court.id },
          data: { syncStatus: 'done', lastSyncedAt: new Date() },
        })

        results.courtsProcessed++
        results.casesUpdated += updated
      } catch (err) {
        console.error(`[CRON] Court sync failed for ${court.id}:`, err)
        await prisma.courtRegistered.update({
          where: { id: court.id },
          data: { syncStatus: 'error' },
        }).catch(() => {})
      }
    }

    // ── 2. Process due reminders ──
    // Reminders with startDate <= today and isActive, check by startDate / frequency
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueReminders = await prisma.reminder.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
      },
      include: {
        profile: { select: { id: true } },
        case: { select: { caseNumber: true, firstParty: true } },
      },
      take: 50,
    })

    for (const reminder of dueReminders) {
      try {
        const profile = await prisma.profile.findUnique({
          where: { id: reminder.profileId },
          select: { email: true, fullName: true },
        })

        if (profile?.email && reminder.sendEmail) {
          await resend.emails.send({
            from: 'Advocase <notifications@advocase.app>',
            to: [profile.email],
            subject: `Reminder: ${reminder.title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1A1A2E;">Reminder: ${reminder.title}</h2>
                ${reminder.case ? `<p><strong>Case:</strong> ${reminder.case.caseNumber ?? ''} — ${reminder.case.firstParty ?? ''}</p>` : ''}
                <p style="color: #64748B; font-size: 12px;">Sent by Advocase</p>
              </div>
            `,
          })
        }

        results.remindersTriggered++
      } catch (err) {
        console.error(`[CRON] Reminder notification failed for ${reminder.id}:`, err)
      }
    }

    console.log('[CRON] Completed:', results)
    return NextResponse.json({ success: true, ...results })
  } catch (error) {
    console.error('[CRON] Fatal error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
