import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  label: z.string().min(1),
  color: z.string().min(4),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const codes = await prisma.colorCode.findMany({
    where: { profileId: session.user.id },
    orderBy: { label: 'asc' },
  })
  return NextResponse.json(codes)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    // Upsert: update color if label already exists for this profile
    const existing = await prisma.colorCode.findFirst({
      where: { profileId: session.user.id, label: parsed.data.label },
    })

    if (existing) {
      const updated = await prisma.colorCode.update({
        where: { id: existing.id },
        data: { color: parsed.data.color },
      })
      return NextResponse.json(updated)
    }

    const created = await prisma.colorCode.create({
      data: {
        profileId: session.user.id,
        label: parsed.data.label,
        color: parsed.data.color,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
