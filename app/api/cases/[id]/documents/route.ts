import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { uploadFile } from '@/lib/supabase/storage'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: caseId } = await params

  try {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId, profileId: session.user.id },
      select: { id: true },
    })
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    const uploadedDocs = []
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const path = `${session.user.id}/${caseId}/${Date.now()}_${file.name}`
      const fileUrl = await uploadFile('case-documents', path, buffer, file.type)

      const doc = await prisma.caseDocument.create({
        data: {
          caseId,
          profileId: session.user.id,
          fileName: file.name,
          fileUrl,
          fileSize: file.size,
          fileType: file.type,
          uploadedBy: session.user.name ?? session.user.email,
        },
      })
      uploadedDocs.push(doc)
    }

    return NextResponse.json(uploadedDocs, { status: 201 })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
