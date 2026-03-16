import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'
import { addHours } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const profile = await prisma.profile.findUnique({ where: { email } })
    if (!profile) {
      // Don't reveal whether email exists
      return NextResponse.json({ success: true })
    }

    const token = crypto.randomBytes(32).toString('hex')
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        resetToken: token,
        resetTokenExpiry: addHours(new Date(), 1),
      },
    })

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

    await resend.emails.send({
      from: 'Advocase <noreply@advocase.in>',
      to: email,
      subject: 'Reset your Advocase password',
      html: `<p>Click the link below to reset your password (valid for 1 hour):</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ success: true }) // Always return success for security
  }
}
