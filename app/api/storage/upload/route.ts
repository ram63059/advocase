import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { uploadFile } from '@/lib/supabase/storage'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = (formData.get('bucket') as string) || 'profile-assets'
    const path = formData.get('path') as string

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadFile(bucket, path || `${session.user.id}/${Date.now()}_${file.name}`, buffer, file.type)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Storage upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
