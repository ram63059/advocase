import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { CaseForm } from '@/components/cases/CaseForm'
import { PageHeader } from '@/components/shared/PageHeader'

interface EditCasePageProps {
  params: Promise<{ id: string }>
}

export default async function EditCasePage({ params }: EditCasePageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const caseData = await prisma.case.findUnique({
    where: { id, profileId: session.user.id },
  })
  if (!caseData) notFound()

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Edit Case"
        description={`${caseData.caseNumber ?? 'Case'} — ${caseData.firstParty ?? ''} vs ${caseData.oppositeParty ?? ''}`}
        breadcrumb={[
          { label: 'Cases', href: '/cases' },
          { label: caseData.caseNumber ?? 'Case', href: `/cases/${id}` },
          { label: 'Edit' },
        ]}
      />
      <CaseForm initialData={caseData} caseId={id} />
    </div>
  )
}
