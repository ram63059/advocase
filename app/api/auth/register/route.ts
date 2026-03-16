import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  fullName:   z.string().min(2),
  email:      z.string().email(),
  officeName: z.string().optional(),
  password:   z.string().min(8),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { fullName, email, officeName, password } = parsed.data

    const existing = await prisma.profile.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.profile.create({
      data: { fullName, email, officeName, passwordHash },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
