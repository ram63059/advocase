import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const reminderSchema = z.object({
  title: z.string().min(1),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly']),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  reminderTime: z.string().optional().nullable(),
  dayOfWeek: z.string().optional().nullable(),
  sendEmail: z.boolean().default(true),
  emailTo: z.string().email().optional().or(z.literal('')).nullable(),
  sendSms: z.boolean().default(false),
  mobileTo: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  caseId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reminders = await prisma.reminder.findMany({
    where: { profileId: session.user.id },
    include: {
      case: { select: { id: true, caseNumber: true, firstParty: true } },
      client: { select: { id: true, fullName: true } },
    },
    orderBy: [{ isActive: 'desc' }, { startDate: 'asc' }],
  })

  return NextResponse.json(reminders)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = reminderSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { startDate, endDate, ...fields } = parsed.data

    const reminder = await prisma.reminder.create({
      data: {
        ...fields,
        profileId: session.user.id,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        emailTo: fields.emailTo || null,
      },
    })

    return NextResponse.json(reminder, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
