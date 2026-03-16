import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ClientsPageClient } from '@/components/clients/ClientsPageClient'

interface ClientsPageProps {
  searchParams: Promise<{ search?: string; page?: string; new?: string }>
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const profileId = session.user.id
  const sp = await searchParams
  const page = Number(sp.page ?? 1)
  const limit = 24
  const skip = (page - 1) * limit

  const where = {
    profileId,
    ...(sp.search && {
      OR: [
        { fullName: { contains: sp.search, mode: 'insensitive' as const } },
        { mobile: { contains: sp.search } },
        { email: { contains: sp.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        cases: {
          where: { case: { status: 'running' } },
          select: { id: true },
        },
        fees: {
          where: { isExpense: false },
          select: { amount: true },
        },
      },
      orderBy: { fullName: 'asc' },
      skip,
      take: limit,
    }),
    prisma.client.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <ClientsPageClient
      clients={clients}
      total={total}
      totalPages={totalPages}
      currentPage={page}
      searchParams={sp}
      showNewForm={sp.new === '1'}
    />
  )
}
