import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  courtType: z.string().min(1),
  state: z.string().optional(),
  district: z.string().optional(),
  courtComplex: z.string().optional(),
  establishment: z.string().optional(),
  barCode: z.string().optional(),
  year: z.number().optional().nullable(),
  advocateName: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const courts = await prisma.courtRegistered.findMany({
    where: { profileId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(courts)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const court = await prisma.courtRegistered.create({
      data: {
        ...parsed.data,
        profileId: session.user.id,
      },
    })

    return NextResponse.json(court, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
