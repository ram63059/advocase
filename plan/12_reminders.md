# Stage 12: Reminders Page

## Goal
Build `/reminders` — a list of all active/inactive reminders with add/edit slide-over drawer. Supports once/daily/weekly/monthly frequency with email notifications.

---

## Files to Create
- `app/(dashboard)/reminders/page.tsx`
- `components/reminders/ReminderList.tsx`
- `components/reminders/ReminderForm.tsx`
- `app/api/reminders/route.ts`
- `app/api/reminders/[id]/route.ts`

---

## Step 1: Reminders Page (`app/(dashboard)/reminders/page.tsx`)

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { RemindersPageClient } from '@/components/reminders/RemindersPageClient'

export default async function RemindersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.userId

  const reminders = await prisma.reminder.findMany({
    where: { profileId: userId },
    include: {
      case: { select: { id: true, caseNumber: true, firstParty: true } },
      client: { select: { id: true, fullName: true } },
    },
    orderBy: [{ isActive: 'desc' }, { startDate: 'asc' }],
  })

  return <RemindersPageClient reminders={reminders} />
}
```

---

## Step 2: Reminders Page Client (`components/reminders/RemindersPageClient.tsx`)

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReminderList } from './ReminderList'
import { ReminderForm } from './ReminderForm'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { EmptyState } from '@/components/shared/EmptyState'
import { Bell } from 'lucide-react'

export function RemindersPageClient({ reminders }) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState(null)

  const handleSaved = () => {
    setFormOpen(false)
    setEditingReminder(null)
    router.refresh()
  }

  const openEdit = (reminder) => {
    setEditingReminder(reminder)
    setFormOpen(true)
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/reminders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Reminders</h1>
          <p className="text-sm text-slate-500">
            {reminders.filter(r => r.isActive).length} active reminders
          </p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus size={16} className="mr-1" />
          Add Reminder
        </Button>
      </div>

      {reminders.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No reminders yet"
          description="Create reminders for hearings, deadlines, and follow-ups."
          action={{ label: 'Add Reminder', onClick: () => setFormOpen(true) }}
        />
      ) : (
        <ReminderList
          reminders={reminders}
          onEdit={openEdit}
          onToggleActive={toggleActive}
          onDelete={async (id) => {
            await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
            router.refresh()
          }}
        />
      )}

      <Sheet open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); setEditingReminder(null) } }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingReminder ? 'Edit Reminder' : 'New Reminder'}</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <ReminderForm
              defaultValues={editingReminder}
              onSuccess={handleSaved}
              onCancel={() => { setFormOpen(false); setEditingReminder(null) }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

---

## Step 3: Reminder List (`components/reminders/ReminderList.tsx`)

```typescript
'use client'
import { format } from 'date-fns'
import { Pencil, Trash2, Mail, Smartphone, Briefcase, User, Bell } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const FREQUENCY_LABELS = {
  once:    'One-time',
  daily:   'Daily',
  weekly:  'Weekly',
  monthly: 'Monthly',
}

export function ReminderList({ reminders, onEdit, onToggleActive, onDelete }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
      {reminders.map(reminder => (
        <div
          key={reminder.id}
          className={cn(
            'flex items-start gap-4 px-5 py-4',
            !reminder.isActive && 'opacity-60'
          )}
        >
          {/* Bell icon */}
          <div className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5',
            reminder.isActive ? 'bg-amber-100' : 'bg-slate-100'
          )}>
            <Bell size={16} className={reminder.isActive ? 'text-amber-600' : 'text-slate-400'} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">{reminder.title}</p>

            <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-500">
              <span className="bg-slate-100 px-2 py-0.5 rounded-full">
                {FREQUENCY_LABELS[reminder.frequency as keyof typeof FREQUENCY_LABELS] ?? reminder.frequency}
              </span>
              {reminder.startDate && (
                <span>From: {format(new Date(reminder.startDate), 'dd MMM yyyy')}</span>
              )}
              {reminder.reminderTime && (
                <span>at {reminder.reminderTime}</span>
              )}
              {reminder.endDate && (
                <span>Until: {format(new Date(reminder.endDate), 'dd MMM yyyy')}</span>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-1">
              {reminder.sendEmail && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Mail size={11} />
                  {reminder.emailTo ?? 'Email'}
                </span>
              )}
              {reminder.sendSms && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Smartphone size={11} />
                  {reminder.mobileTo ?? 'SMS'}
                </span>
              )}
              {reminder.case && (
                <span className="text-xs text-indigo-600 flex items-center gap-1">
                  <Briefcase size={11} />
                  <span className="font-mono">{reminder.case.caseNumber ?? 'Case'}</span>
                </span>
              )}
              {reminder.client && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <User size={11} />
                  {reminder.client.fullName}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <Switch
              checked={reminder.isActive}
              onCheckedChange={() => onToggleActive(reminder.id, reminder.isActive)}
            />
            <button
              onClick={() => onEdit(reminder)}
              className="text-slate-400 hover:text-slate-700"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(reminder.id)}
              className="text-slate-400 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## Step 4: Reminder Form (`components/reminders/ReminderForm.tsx`)

```typescript
'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const reminderSchema = z.object({
  title:        z.string().min(1, 'Title is required'),
  frequency:    z.enum(['once', 'daily', 'weekly', 'monthly']),
  startDate:    z.string().optional(),
  endDate:      z.string().optional(),
  reminderTime: z.string().optional(),
  dayOfWeek:    z.string().optional(),
  sendEmail:    z.boolean().default(true),
  emailTo:      z.string().email().optional().or(z.literal('')),
  sendSms:      z.boolean().default(false),
  mobileTo:     z.string().optional(),
  caseId:       z.string().optional(),
  clientId:     z.string().optional(),
})

type ReminderValues = z.infer<typeof reminderSchema>

export function ReminderForm({ defaultValues, onSuccess, onCancel }) {
  const [saving, setSaving] = useState(false)
  const [selectedCase, setSelectedCase] = useState(defaultValues?.case ?? null)
  const [selectedClient, setSelectedClient] = useState(defaultValues?.client ?? null)
  const [caseQuery, setCaseQuery] = useState('')
  const [caseResults, setCaseResults] = useState([])
  const isEdit = !!defaultValues?.id

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<ReminderValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: defaultValues ? {
      ...defaultValues,
      startDate: defaultValues.startDate ? new Date(defaultValues.startDate).toISOString().split('T')[0] : '',
      endDate: defaultValues.endDate ? new Date(defaultValues.endDate).toISOString().split('T')[0] : '',
    } : {
      frequency: 'once',
      sendEmail: true,
      sendSms: false,
    }
  })

  const frequency = watch('frequency')
  const sendEmail = watch('sendEmail')
  const sendSms = watch('sendSms')

  const searchCases = async (q: string) => {
    if (q.length < 2) { setCaseResults([]); return }
    const res = await fetch(`/api/cases/search?q=${encodeURIComponent(q)}`)
    setCaseResults(await res.json())
  }

  const onSubmit = async (values: ReminderValues) => {
    setSaving(true)
    try {
      const url = isEdit ? `/api/reminders/${defaultValues.id}` : '/api/reminders'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          caseId: selectedCase?.id,
          clientId: selectedClient?.id,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(isEdit ? 'Reminder updated' : 'Reminder created')
      onSuccess()
    } catch {
      toast.error('Failed to save reminder')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Title */}
      <div>
        <Label>Reminder Title *</Label>
        <Input {...register('title')} placeholder="e.g. Next hearing reminder" />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      {/* Frequency tabs */}
      <div>
        <Label className="mb-2 block">Frequency</Label>
        <Controller
          control={control}
          name="frequency"
          render={({ field }) => (
            <Tabs value={field.value} onValueChange={field.onChange}>
              <TabsList className="w-full">
                <TabsTrigger value="once" className="flex-1">Once</TabsTrigger>
                <TabsTrigger value="daily" className="flex-1">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="flex-1">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="flex-1">Monthly</TabsTrigger>
              </TabsList>

              <TabsContent value="once" className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" {...register('startDate')} />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input type="time" {...register('reminderTime')} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="daily" className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" {...register('startDate')} />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" {...register('endDate')} />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input type="time" {...register('reminderTime')} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="weekly" className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Day of Week</Label>
                    <Controller
                      control={control}
                      name="dayOfWeek"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map(d => (
                              <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input type="time" {...register('reminderTime')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" {...register('startDate')} />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" {...register('endDate')} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="monthly" className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" {...register('startDate')} />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" {...register('endDate')} />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input type="time" {...register('reminderTime')} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        />
      </div>

      {/* Notification settings */}
      <div className="space-y-3">
        <Label className="block">Send Via</Label>

        <div className="flex items-center gap-3">
          <Controller
            control={control}
            name="sendEmail"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} id="sendEmail" />
            )}
          />
          <label htmlFor="sendEmail" className="text-sm">Email</label>
        </div>

        {sendEmail && (
          <div>
            <Label>Email Address</Label>
            <Input
              type="email"
              {...register('emailTo')}
              placeholder="recipient@email.com"
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <Controller
            control={control}
            name="sendSms"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} id="sendSms" />
            )}
          />
          <label htmlFor="sendSms" className="text-sm">SMS (manual — save number)</label>
        </div>

        {sendSms && (
          <div>
            <Label>Mobile Number</Label>
            <Input {...register('mobileTo')} placeholder="10-digit mobile number" />
          </div>
        )}
      </div>

      {/* Link to Case */}
      <div>
        <Label>Link to Case (optional)</Label>
        {selectedCase ? (
          <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-md text-sm">
            <span className="text-indigo-700">{selectedCase.caseNumber} — {selectedCase.firstParty}</span>
            <button type="button" onClick={() => setSelectedCase(null)} className="text-indigo-400">×</button>
          </div>
        ) : (
          <div className="relative">
            <Input
              placeholder="Search cases…"
              value={caseQuery}
              onChange={e => { setCaseQuery(e.target.value); searchCases(e.target.value) }}
            />
            {caseResults.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-md mt-1">
                {caseResults.map(c => (
                  <button key={c.id} type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                    onClick={() => { setSelectedCase(c); setCaseResults([]); setCaseQuery('') }}
                  >
                    <span className="font-mono">{c.caseNumber}</span> — {c.firstParty}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Saving…' : isEdit ? 'Update' : 'Create Reminder'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
```

---

## API Routes

### `app/api/reminders/route.ts`
```typescript
// GET: list all reminders for current user
// POST: create reminder
//   Validates frequency rules (weekly requires dayOfWeek, etc.)
//   If sendEmail: validate emailTo is present
```

### `app/api/reminders/[id]/route.ts`
```typescript
// PATCH: update reminder (including isActive toggle)
// DELETE: delete reminder
```

---

## Cron Integration: Send Reminder Emails

The `/api/sync/cron` route (Stage 20) also checks reminders:

```typescript
// In cron job: find all active reminders where today matches frequency
const today = new Date()

const reminders = await prisma.reminder.findMany({
  where: {
    isActive: true,
    OR: [
      { frequency: 'daily', startDate: { lte: today }, endDate: { gte: today } },
      { frequency: 'once', startDate: { equals: today } },
      { frequency: 'weekly', dayOfWeek: format(today, 'EEEE').toLowerCase(), startDate: { lte: today } },
      { frequency: 'monthly', startDate: { lte: today } }, // check day-of-month
    ]
  },
  include: { case: true, client: true }
})

// Send emails via Resend for each matching reminder with sendEmail: true
```

---

## Verification Checklist
- [ ] Reminder list shows all reminders (active + inactive)
- [ ] Active toggle (Switch) updates isActive via API
- [ ] Add Reminder opens frequency tabs
- [ ] "Once" frequency shows single date + time
- [ ] "Daily" frequency shows date range + time
- [ ] "Weekly" frequency shows day-of-week selector + date range
- [ ] "Monthly" frequency shows date range
- [ ] Email toggle shows email input
- [ ] SMS toggle shows mobile input
- [ ] Case search links reminder to a case
- [ ] Edit reminder pre-fills the form
- [ ] Delete reminder works and refreshes list
- [ ] Empty state shows when no reminders exist
