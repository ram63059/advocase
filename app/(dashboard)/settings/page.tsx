import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { SettingsPageClient } from '@/components/settings/SettingsPageClient'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [profile, courts] = await Promise.all([
    prisma.profile.findUnique({ where: { id: session.user.id } }),
    prisma.courtRegistered.findMany({
      where: { profileId: session.user.id },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  if (!profile) redirect('/login')

  return <SettingsPageClient profile={profile} courts={courts} />
}
