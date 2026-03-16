import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''

  if (q.length < 2) return NextResponse.json([])

  const clients = await prisma.client.findMany({
    where: {
      profileId: session.user.id,
      OR: [
        { fullName: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, fullName: true, mobile: true, email: true },
    take: 10,
    orderBy: { fullName: 'asc' },
  })

  return NextResponse.json(clients)
}
