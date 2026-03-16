import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const counselSchema = z.object({
  fullName: z.string().min(1),
  mobile: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: caseId } = await params

  try {
    const body = await request.json()
    const parsed = counselSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const caseData = await prisma.case.findUnique({
      where: { id: caseId, profileId: session.user.id },
      select: { id: true },
    })
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const counsel = await prisma.opposeCounsel.create({
      data: {
        caseId,
        fullName: parsed.data.fullName,
        mobile: parsed.data.mobile,
        email: parsed.data.email || null,
        address: parsed.data.address,
      },
    })

    return NextResponse.json(counsel, { status: 201 })
  } catch (error) {
    console.error('[POST opposite-counsel]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
