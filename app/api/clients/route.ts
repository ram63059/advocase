import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const clientSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  mobile: z.string().optional(),
  address: z.string().optional(),
  dpdpConsent: z.boolean().default(false),
})

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')

  const clients = await prisma.client.findMany({
    where: {
      profileId: session.user.id,
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { mobile: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      _count: { select: { cases: true } },
    },
    orderBy: { fullName: 'asc' },
  })

  return NextResponse.json(clients)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = clientSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const client = await prisma.client.create({
      data: {
        ...parsed.data,
        profileId: session.user.id,
        email: parsed.data.email || null,
        dpdpConsentAt: parsed.data.dpdpConsent ? new Date() : null,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
