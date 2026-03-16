import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateClientSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  mobile: z.string().optional(),
  address: z.string().optional(),
  dpdpConsent: z.boolean().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const client = await prisma.client.findUnique({
    where: { id, profileId: session.user.id },
    include: {
      cases: {
        include: {
          case: {
            select: {
              id: true, caseNumber: true, firstParty: true, oppositeParty: true,
              courtName: true, nextDate: true, status: true,
            },
          },
        },
      },
      fees: { orderBy: { feeDate: 'desc' }, take: 10 },
    },
  })

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(client)
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
    const parsed = updateClientSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const updated = await prisma.client.update({
      where: { id, profileId: session.user.id },
      data: {
        ...parsed.data,
        email: parsed.data.email || null,
        ...(parsed.data.dpdpConsent !== undefined && {
          dpdpConsentAt: parsed.data.dpdpConsent ? new Date() : null,
        }),
      },
    })
    return NextResponse.json(updated)
  } catch {
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
    await prisma.client.delete({ where: { id, profileId: session.user.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
