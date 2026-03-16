import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  officeName: z.string().optional().nullable(),
  officeAddress: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  qrCodeUrl: z.string().url().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankAccountName: z.string().optional().nullable(),
  bankIfsc: z.string().optional().nullable(),
  bankAccountNo: z.string().optional().nullable(),
  upiId: z.string().optional().nullable(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      officeName: true,
      officeAddress: true,
      mobile: true,
      logoUrl: true,
      qrCodeUrl: true,
      bankName: true,
      bankAccountName: true,
      bankIfsc: true,
      bankAccountNo: true,
      upiId: true,
      plan: true,
      planExpiresAt: true,
    },
  })

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(profile)
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const updated = await prisma.profile.update({
      where: { id: session.user.id },
      data: parsed.data,
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
