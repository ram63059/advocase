import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getSignedUrl } from '@/lib/supabase/storage'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { docId } = await params

  try {
    const doc = await prisma.caseDocument.findUnique({
      where: { id: docId },
      select: { id: true, profileId: true, fileUrl: true, fileName: true },
    })

    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (doc.profileId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Extract storage path from the public URL
    const url = new URL(doc.fileUrl)
    const pathParts = url.pathname.split('/case-documents/')
    if (!pathParts[1]) {
      // File is publicly accessible — redirect directly
      return NextResponse.redirect(doc.fileUrl)
    }

    const signedUrl = await getSignedUrl('case-documents', pathParts[1])
    return NextResponse.redirect(signedUrl)
  } catch (error) {
    console.error('[GET document download]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
