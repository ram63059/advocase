import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const noteSchema = z.object({
  noteText: z.string().min(1),
  purpose: z.string().optional(),
  noteDate: z.string().optional(),
  addedBy: z.string().optional(),
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
    const parsed = noteSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const caseData = await prisma.case.findUnique({
      where: { id: caseId, profileId: session.user.id },
      select: { id: true },
    })
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const note = await prisma.caseNote.create({
      data: {
        caseId,
        profileId: session.user.id,
        noteText: parsed.data.noteText,
        purpose: parsed.data.purpose,
        noteDate: parsed.data.noteDate ? new Date(parsed.data.noteDate) : null,
        addedBy: parsed.data.addedBy ?? session.user.name,
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
