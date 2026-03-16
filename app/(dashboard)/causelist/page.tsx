import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CauseListPageClient } from '@/components/causelist/CauseListPageClient'

export const metadata = { title: 'Cause List — Advocase' }

export default async function CauseListPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return <CauseListPageClient />
}
