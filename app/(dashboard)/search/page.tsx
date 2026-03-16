import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SearchPageClient } from '@/components/search/SearchPageClient'

export default async function SearchPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return <SearchPageClient profileId={session.user.id} />
}
