import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { deleteFile } from '@/lib/supabase/storage'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: caseId, docId } = await params

  try {
    const doc = await prisma.caseDocument.findUnique({
      where: { id: docId },
      select: { id: true, caseId: true, profileId: true, fileUrl: true },
    })

    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (doc.caseId !== caseId || doc.profileId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Extract storage path from URL (everything after the bucket path)
    try {
      const url = new URL(doc.fileUrl)
      const pathParts = url.pathname.split('/case-documents/')
      if (pathParts[1]) {
        await deleteFile('case-documents', pathParts[1])
      }
    } catch {
      // If file deletion fails, still remove the DB record
    }

    await prisma.caseDocument.delete({ where: { id: docId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE document]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
