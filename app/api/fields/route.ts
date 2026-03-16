import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  fieldType: z.enum(['casetype', 'ps', 'court', 'us', 'empanelment']),
  value: z.string().min(1),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fields = await prisma.customField.findMany({
    where: { profileId: session.user.id },
    orderBy: [{ fieldType: 'asc' }, { sortOrder: 'asc' }],
  })

  return NextResponse.json(fields)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    // Check if value already exists for this type
    const existing = await prisma.customField.findFirst({
      where: {
        profileId: session.user.id,
        fieldType: parsed.data.fieldType,
        value: { equals: parsed.data.value, mode: 'insensitive' },
      },
    })
    if (existing) {
      return NextResponse.json({ error: 'Value already exists' }, { status: 409 })
    }

    // Get max sort order for this type
    const maxOrder = await prisma.customField.aggregate({
      where: { profileId: session.user.id, fieldType: parsed.data.fieldType },
      _max: { sortOrder: true },
    })

    const field = await prisma.customField.create({
      data: {
        profileId: session.user.id,
        fieldType: parsed.data.fieldType,
        value: parsed.data.value,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    })

    return NextResponse.json(field, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
