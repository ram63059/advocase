import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rawBody = await request.json()
    const parsed = schema.safeParse(rawBody)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { to, subject, body } = parsed.data

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'notifications@advocase.app',
      to,
      subject,
      html: `<div style="font-family:sans-serif;line-height:1.6">${body.replace(/\n/g, '<br/>')}</div>`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
