import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const counselUpdateSchema = z.object({
  fullName: z.string().min(1).optional(),
  mobile: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; counselId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: caseId, counselId } = await params

  try {
    const body = await request.json()
    const parsed = counselUpdateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    // Verify ownership via case
    const caseData = await prisma.case.findUnique({
      where: { id: caseId, profileId: session.user.id },
      select: { id: true },
    })
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const counsel = await prisma.opposeCounsel.update({
      where: { id: counselId, caseId },
      data: {
        ...(parsed.data.fullName && { fullName: parsed.data.fullName }),
        mobile: parsed.data.mobile,
        email: parsed.data.email || null,
        address: parsed.data.address,
      },
    })

    return NextResponse.json(counsel)
  } catch (error) {
    console.error('[PATCH opposite-counsel]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; counselId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: caseId, counselId } = await params

  try {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId, profileId: session.user.id },
      select: { id: true },
    })
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.opposeCounsel.delete({ where: { id: counselId, caseId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE opposite-counsel]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
