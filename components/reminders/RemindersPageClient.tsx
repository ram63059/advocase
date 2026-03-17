'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReminderList } from './ReminderList'
import { ReminderForm } from './ReminderForm'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { EmptyState } from '@/components/shared/EmptyState'
import { toast } from 'sonner'

interface RemindersPageClientProps { reminders: any[] }

export function RemindersPageClient({ reminders }: RemindersPageClientProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<any>(null)

  const handleSaved = () => { setFormOpen(false); setEditingReminder(null); router.refresh() }
  const openEdit = (reminder: any) => { setEditingReminder(reminder); setFormOpen(true) }

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/reminders/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
      toast.success('Reminder deleted')
      router.refresh()
    } catch { toast.error('Failed to delete reminder') }
  }

  const activeCount = reminders.filter(r => r.isActive).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reminders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCount > 0 ? `${activeCount} active ${activeCount === 1 ? 'reminder' : 'reminders'}` : 'No active reminders'}
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditingReminder(null); setFormOpen(true) }}>
          <Plus size={14} className="mr-1.5" /> Add Reminder
        </Button>
      </div>

      {reminders.length === 0 ? (
        <EmptyState icon={Bell} title="No reminders yet"
          description="Create reminders for hearings, deadlines, and follow-ups."
          action={{ label: 'Add Reminder', onClick: () => setFormOpen(true) }} />
      ) : (
        <ReminderList reminders={reminders} onEdit={openEdit} onToggleActive={toggleActive} onDelete={handleDelete} />
      )}

      <Sheet open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); setEditingReminder(null) } }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingReminder ? 'Edit Reminder' : 'New Reminder'}</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <ReminderForm defaultValues={editingReminder} onSuccess={handleSaved}
              onCancel={() => { setFormOpen(false); setEditingReminder(null) }} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
