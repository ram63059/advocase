import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  dueDate: z.string().optional().nullable(),
  assignedTo: z.string().optional(),
  caseId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const tasks = await prisma.task.findMany({
    where: {
      profileId: session.user.id,
      ...(status && { status }),
    },
    include: {
      case: { select: { id: true, caseNumber: true, firstParty: true } },
      client: { select: { id: true, fullName: true } },
    },
    orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
  })

  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = taskSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { dueDate, ...fields } = parsed.data

    const task = await prisma.task.create({
      data: {
        ...fields,
        profileId: session.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
