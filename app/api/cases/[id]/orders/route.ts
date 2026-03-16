import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const orderSchema = z.object({
  orderType: z.string().optional(),
  orderDate: z.string().optional(),
  orderUrl: z.string().optional(),
  description: z.string().optional(),
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
    const parsed = orderSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    // Verify case ownership
    const caseData = await prisma.case.findUnique({
      where: { id: caseId, profileId: session.user.id },
      select: { id: true },
    })
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const order = await prisma.caseOrder.create({
      data: {
        caseId,
        ...parsed.data,
        orderDate: parsed.data.orderDate ? new Date(parsed.data.orderDate) : null,
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
