import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { FieldsPageClient } from '@/components/admin/FieldsPageClient'

export default async function FieldsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const profileId = session.user.id

  const allFields = await prisma.customField.findMany({
    where: { profileId },
    orderBy: [{ fieldType: 'asc' }, { sortOrder: 'asc' }],
  })

  const grouped = {
    casetype: allFields.filter(f => f.fieldType === 'casetype'),
    ps: allFields.filter(f => f.fieldType === 'ps'),
    court: allFields.filter(f => f.fieldType === 'court'),
    us: allFields.filter(f => f.fieldType === 'us'),
    empanelment: allFields.filter(f => f.fieldType === 'empanelment'),
  }

  return <FieldsPageClient grouped={grouped} profileId={profileId} />
}
