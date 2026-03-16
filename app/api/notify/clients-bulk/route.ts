import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

function formatDate(date: Date | null) {
  if (!date) return 'TBD'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profileId = session.user.id

  try {
    const { caseIds } = await request.json()
    if (!Array.isArray(caseIds) || caseIds.length === 0) {
      return NextResponse.json({ error: 'No case IDs provided' }, { status: 400 })
    }

    const [cases, profile] = await Promise.all([
      prisma.case.findMany({
        where: { id: { in: caseIds }, profileId },
        include: {
          clients: {
            include: {
              client: { select: { email: true, fullName: true } },
            },
          },
        },
      }),
      prisma.profile.findUnique({
        where: { id: profileId },
        select: { fullName: true, officeName: true, mobile: true },
      }),
    ])

    let sent = 0
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'notifications@advocase.app'

    for (const c of cases) {
      for (const cc of c.clients) {
        if (!cc.client.email) continue

        await resend.emails.send({
          from: fromEmail,
          to: cc.client.email,
          subject: `Hearing Notice: ${c.caseNumber ?? 'Your Case'}`,
          html: `
            <div style="font-family:sans-serif;line-height:1.6;max-width:600px;margin:0 auto">
              <p>Dear ${cc.client.fullName},</p>
              <p>Your case <strong>${c.caseNumber ?? 'under our reference'}</strong> is scheduled for hearing on <strong>${formatDate(c.nextDate)}</strong>${c.fixedFor ? ` for <em>${c.fixedFor}</em>` : ''} at <strong>${c.courtName ?? 'the court'}</strong>.</p>
              <p>Please be present or provide instructions to your advocate in advance.</p>
              <p>Regards,<br/>
              <strong>${profile?.fullName ?? 'Your Advocate'}</strong><br/>
              ${profile?.officeName ? `${profile.officeName}<br/>` : ''}
              ${profile?.mobile ?? ''}</p>
            </div>
          `,
        })
        sent++
      }
    }

    return NextResponse.json({ sent })
  } catch (error) {
    console.error('Bulk notify error:', error)
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
}
