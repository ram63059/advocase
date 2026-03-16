import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly']).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  reminderTime: z.string().optional().nullable(),
  dayOfWeek: z.string().optional().nullable(),
  sendEmail: z.boolean().optional(),
  emailTo: z.string().email().optional().or(z.literal('')).nullable(),
  sendSms: z.boolean().optional(),
  mobileTo: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  caseId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { startDate, endDate, ...fields } = parsed.data

    const updated = await prisma.reminder.update({
      where: { id, profileId: session.user.id },
      data: {
        ...fields,
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(fields.emailTo !== undefined && { emailTo: fields.emailTo || null }),
      },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await prisma.reminder.delete({ where: { id, profileId: session.user.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
