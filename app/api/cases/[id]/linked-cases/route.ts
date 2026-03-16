import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const linkSchema = z.object({
  linkedCaseId: z.string().min(1),
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
    const parsed = linkSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { linkedCaseId } = parsed.data

    if (caseId === linkedCaseId) {
      return NextResponse.json({ error: 'Cannot link a case to itself' }, { status: 400 })
    }

    // Verify both cases belong to the user
    const [caseA, caseB] = await Promise.all([
      prisma.case.findUnique({ where: { id: caseId, profileId: session.user.id }, select: { id: true } }),
      prisma.case.findUnique({ where: { id: linkedCaseId, profileId: session.user.id }, select: { id: true } }),
    ])
    if (!caseA || !caseB) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

    // Create bidirectional link
    await prisma.linkedCase.createMany({
      data: [
        { caseId, linkedCaseId },
        { caseId: linkedCaseId, linkedCaseId: caseId },
      ],
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('[POST linked-cases]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: caseId } = await params
  const { searchParams } = new URL(request.url)
  const linkedCaseId = searchParams.get('linkedCaseId')

  if (!linkedCaseId) return NextResponse.json({ error: 'linkedCaseId required' }, { status: 400 })

  try {
    // Verify ownership
    const caseData = await prisma.case.findUnique({
      where: { id: caseId, profileId: session.user.id },
      select: { id: true },
    })
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Remove bidirectional link
    await prisma.linkedCase.deleteMany({
      where: {
        OR: [
          { caseId, linkedCaseId },
          { caseId: linkedCaseId, linkedCaseId: caseId },
        ],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE linked-cases]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
