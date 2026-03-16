import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; feeId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: caseId, feeId } = await params

  try {
    const fee = await prisma.fee.findUnique({
      where: { id: feeId },
      select: { id: true, caseId: true, profileId: true },
    })

    if (!fee) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (fee.caseId !== caseId || fee.profileId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.fee.delete({ where: { id: feeId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE fee]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
