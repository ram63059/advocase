import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateCaseSchema = z.object({
  courtType: z.string().optional(),
  courtName: z.string().optional(),
  courtNo: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  caseNumber: z.string().optional(),
  cnrNumber: z.string().optional(),
  referenceNo: z.string().optional(),
  fileNo: z.string().optional(),
  fileName: z.string().optional(),
  year: z.number().optional().nullable(),
  firstParty: z.string().optional(),
  oppositeParty: z.string().optional(),
  caseType: z.string().optional(),
  underSection: z.string().optional(),
  policeStation: z.string().optional(),
  firNumber: z.string().optional(),
  judgeName: z.string().optional(),
  company: z.string().optional(),
  empanelment: z.string().optional(),
  comments: z.string().optional(),
  filingDate: z.string().optional().nullable(),
  previousDate: z.string().optional().nullable(),
  nextDate: z.string().optional().nullable(),
  fixedFor: z.string().optional(),
  status: z.enum(['running', 'decided', 'abandoned']).optional(),
  isImportant: z.boolean().optional(),
  briefFacts: z.string().optional(),
  relevantLaws: z.string().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const caseData = await prisma.case.findUnique({
    where: { id, profileId: session.user.id },
    include: {
      history: { orderBy: { hearingDate: 'desc' } },
      clients: { include: { client: true } },
      fees: { orderBy: { feeDate: 'desc' } },
    },
  })

  if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(caseData)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = updateCaseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { filingDate, previousDate, nextDate, ...fields } = parsed.data

    const updated = await prisma.case.update({
      where: { id, profileId: session.user.id },
      data: {
        ...fields,
        ...(filingDate !== undefined && { filingDate: filingDate ? new Date(filingDate) : null }),
        ...(previousDate !== undefined && { previousDate: previousDate ? new Date(previousDate) : null }),
        ...(nextDate !== undefined && { nextDate: nextDate ? new Date(nextDate) : null }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update case error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await prisma.case.delete({
      where: { id, profileId: session.user.id },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
