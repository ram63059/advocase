import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CaseForm } from '@/components/cases/CaseForm'
import { PageHeader } from '@/components/shared/PageHeader'

export default async function NewCasePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="New Case"
        description="Add a new case to your portfolio"
        breadcrumb={[
          { label: 'Cases', href: '/cases' },
          { label: 'New Case' },
        ]}
      />
      <CaseForm />
    </div>
  )
}
