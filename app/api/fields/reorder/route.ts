import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  fieldType: z.string(),
  orderedIds: z.array(z.string()),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const updates = parsed.data.orderedIds.map((id, index) =>
      prisma.customField.update({
        where: { id, profileId: session.user.id },
        data: { sortOrder: index + 1 },
      })
    )

    await prisma.$transaction(updates)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Reorder failed' }, { status: 500 })
  }
}
