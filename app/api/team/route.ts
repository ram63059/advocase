import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const teamMemberSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().optional(),
  role: z.enum(['associate', 'partner', 'junior', 'clerk']).default('associate'),
  canAddCase: z.boolean().default(true),
  canEditCase: z.boolean().default(false),
  canViewCase: z.boolean().default(true),
  canViewFees: z.boolean().default(false),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ownerId = session.user.id

  try {
    const body = await request.json()
    const parsed = teamMemberSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const existing = await prisma.teamMember.findFirst({
      where: { ownerId, email: parsed.data.email },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already invited' }, { status: 409 })
    }

    const member = await prisma.teamMember.create({
      data: {
        ...parsed.data,
        ownerId,
        invitedAt: new Date(),
      },
    })

    // Send invite email
    const profile = await prisma.profile.findUnique({
      where: { id: ownerId },
      select: { fullName: true, officeName: true },
    })

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/signup?invite=${member.id}&email=${encodeURIComponent(parsed.data.email)}`

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'notifications@advocase.app',
        to: parsed.data.email,
        subject: `You've been invited to join ${profile?.officeName ?? 'Advocase'}`,
        html: `
          <div style="font-family:sans-serif;line-height:1.6;max-width:600px;margin:0 auto">
            <h2>You've been invited to Advocase</h2>
            <p>Hi ${parsed.data.fullName},</p>
            <p><strong>${profile?.fullName ?? 'Your colleague'}</strong> has invited you to join their workspace on Advocase.</p>
            <p><a href="${inviteUrl}" style="display:inline-block;background:#4F46E5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Accept Invitation</a></p>
            <p style="color:#888;font-size:12px">If you didn't expect this email, you can ignore it.</p>
          </div>
        `,
      })
    } catch {
      // Don't fail the request if email fails
      console.warn('Failed to send invite email')
    }

    return NextResponse.json(member, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
