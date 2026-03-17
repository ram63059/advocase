'use client'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FieldTypeList } from './FieldTypeList'
import { toast } from 'sonner'

const FIELD_TYPES = [
  { key: 'casetype', label: 'Case Type' },
  { key: 'ps', label: 'P.S. / Company' },
  { key: 'court', label: 'Court' },
  { key: 'us', label: 'Under Section' },
  { key: 'empanelment', label: 'Empanelment' },
]

interface FieldsPageClientProps {
  grouped: Record<string, any[]>
  profileId: string
}

export function FieldsPageClient({ grouped, profileId }: FieldsPageClientProps) {
  const router = useRouter()

  const handleAdd = async (fieldType: string, value: string) => {
    try {
      const res = await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldType, value }),
      })
      if (!res.ok) {
        const err = await res.json()
        if (err.error === 'Value already exists') {
          toast.error('This value already exists')
          return
        }
        throw new Error('Failed')
      }
      toast.success('Value added')
      router.refresh()
    } catch {
      toast.error('Failed to add value')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/fields/${id}`, { method: 'DELETE' })
      toast.success('Value removed')
      router.refresh()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleEdit = async (id: string, value: string) => {
    try {
      await fetch(`/api/fields/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      toast.success('Value updated')
      router.refresh()
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleReorder = async (fieldType: string, orderedIds: string[]) => {
    try {
      await fetch('/api/fields/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldType, orderedIds }),
      })
      router.refresh()
    } catch {
      toast.error('Failed to reorder')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Field Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage dropdown options used in case forms
        </p>
      </div>

      <Tabs defaultValue="casetype">
        <TabsList className="w-full">
          {FIELD_TYPES.map(ft => (
            <TabsTrigger key={ft.key} value={ft.key} className="flex-1 text-xs">
              {ft.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {FIELD_TYPES.map(ft => (
          <TabsContent key={ft.key} value={ft.key} className="mt-4">
            <FieldTypeList
              fieldType={ft.key}
              label={ft.label}
              items={grouped[ft.key] ?? []}
              onAdd={(value) => handleAdd(ft.key, value)}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onReorder={(ids) => handleReorder(ft.key, ids)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
