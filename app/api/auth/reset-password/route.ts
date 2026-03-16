import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()
    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const profile = await prisma.profile.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        passwordHash: await bcrypt.hash(password, 12),
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
