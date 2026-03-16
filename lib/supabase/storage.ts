import { createClient } from '@supabase/supabase-js'

// Server-side only — uses service role to bypass RLS for storage
export function createStorageClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Upload a file to Supabase Storage, returns public URL
export async function uploadFile(
  bucket: 'case-documents' | 'profile-assets',
  path: string,
  file: Buffer | Blob,
  contentType: string
): Promise<string> {
  const supabase = createStorageClient()
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// Generate a signed URL for private file download (1 hour expiry)
export async function getSignedUrl(bucket: string, path: string): Promise<string> {
  const supabase = createStorageClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

// Delete a file from storage
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = createStorageClient()
  await supabase.storage.from(bucket).remove([path])
}
