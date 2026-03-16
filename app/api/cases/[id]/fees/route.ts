import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const feeSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
  feeDate: z.string().optional(),
  paymentMode: z.string().optional(),
  isExpense: z.boolean().default(false),
  clientId: z.string().optional().nullable(),
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
    const parsed = feeSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const caseData = await prisma.case.findUnique({
      where: { id: caseId, profileId: session.user.id },
      select: { id: true },
    })
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const fee = await prisma.fee.create({
      data: {
        caseId,
        profileId: session.user.id,
        amount: parsed.data.amount,
        description: parsed.data.description,
        feeDate: parsed.data.feeDate ? new Date(parsed.data.feeDate) : null,
        paymentMode: parsed.data.paymentMode,
        isExpense: parsed.data.isExpense,
        clientId: parsed.data.clientId,
      },
    })

    return NextResponse.json(fee, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
