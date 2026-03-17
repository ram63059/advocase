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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]

const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  reminderTime: z.string().optional(),
  dayOfWeek: z.string().optional(),
  sendEmail: z.boolean().default(true),
  emailTo: z.string().email('Invalid email').optional().or(z.literal('')),
  sendSms: z.boolean().default(false),
  mobileTo: z.string().optional(),
})

type ReminderValues = z.infer<typeof reminderSchema>

interface ReminderFormProps {
  defaultValues?: any
  onSuccess: () => void
  onCancel: () => void
}

export function ReminderForm({ defaultValues, onSuccess, onCancel }: ReminderFormProps) {
  const [saving, setSaving] = useState(false)
  const [selectedCase, setSelectedCase] = useState<any>(defaultValues?.case ?? null)
  const [caseQuery, setCaseQuery] = useState('')
  const [caseResults, setCaseResults] = useState<any[]>([])
  const isEdit = !!defaultValues?.id

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<ReminderValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: defaultValues
      ? {
          title: defaultValues.title,
          frequency: defaultValues.frequency ?? 'once',
          startDate: defaultValues.startDate
            ? new Date(defaultValues.startDate).toISOString().split('T')[0]
            : '',
          endDate: defaultValues.endDate
            ? new Date(defaultValues.endDate).toISOString().split('T')[0]
            : '',
          reminderTime: defaultValues.reminderTime ?? '',
          dayOfWeek: defaultValues.dayOfWeek ?? '',
          sendEmail: defaultValues.sendEmail ?? true,
          emailTo: defaultValues.emailTo ?? '',
          sendSms: defaultValues.sendSms ?? false,
          mobileTo: defaultValues.mobileTo ?? '',
        }
      : {
          frequency: 'once',
          sendEmail: true,
          sendSms: false,
        },
  })

  const sendEmail = watch('sendEmail')
  const sendSms = watch('sendSms')

  const searchCases = async (q: string) => {
    if (q.length < 2) { setCaseResults([]); return }
    const res = await fetch(`/api/cases/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setCaseResults(data)
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
          caseId: selectedCase?.id ?? null,
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
        <Label htmlFor="title">Reminder Title *</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="e.g. Next hearing reminder"
          className="mt-1"
        />
        {errors.title && (
          <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
        )}
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
                    <Label htmlFor="startDateOnce">Date</Label>
                    <Input id="startDateOnce" type="date" {...register('startDate')} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="reminderTimeOnce">Time</Label>
                    <Input id="reminderTimeOnce" type="time" {...register('reminderTime')} className="mt-1" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="daily" className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" {...register('startDate')} className="mt-1" />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" {...register('endDate')} className="mt-1" />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input type="time" {...register('reminderTime')} className="mt-1" />
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
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map(d => (
                              <SelectItem key={d} value={d} className="capitalize">
                                {d.charAt(0).toUpperCase() + d.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input type="time" {...register('reminderTime')} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" {...register('startDate')} className="mt-1" />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" {...register('endDate')} className="mt-1" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="monthly" className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" {...register('startDate')} className="mt-1" />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" {...register('endDate')} className="mt-1" />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input type="time" {...register('reminderTime')} className="mt-1" />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        />
      </div>

      {/* Send Via */}
      <div className="space-y-3">
        <Label className="block text-sm font-medium">Send Via</Label>

        <div className="flex items-center gap-3">
          <Controller
            control={control}
            name="sendEmail"
            render={({ field }) => (
              <Switch id="sendEmail" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <label htmlFor="sendEmail" className="text-sm text-foreground">Email</label>
        </div>

        {sendEmail && (
          <div>
            <Label htmlFor="emailTo">Email Address</Label>
            <Input
              id="emailTo"
              type="email"
              {...register('emailTo')}
              placeholder="recipient@email.com"
              className="mt-1"
            />
            {errors.emailTo && (
              <p className="text-xs text-destructive mt-1">{errors.emailTo.message}</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Controller
            control={control}
            name="sendSms"
            render={({ field }) => (
              <Switch id="sendSms" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <label htmlFor="sendSms" className="text-sm text-foreground">
            SMS <span className="text-muted-foreground">(save number for reference)</span>
          </label>
        </div>

        {sendSms && (
          <div>
            <Label htmlFor="mobileTo">Mobile Number</Label>
            <Input
              id="mobileTo"
              {...register('mobileTo')}
              placeholder="10-digit mobile number"
              className="mt-1"
            />
          </div>
        )}
      </div>

      {/* Link to Case */}
      <div>
        <Label>Link to Case (optional)</Label>
        {selectedCase ? (
          <div className="mt-1 flex items-center justify-between p-2.5 bg-secondary rounded-xl text-sm border border-border">
            <span className="text-foreground truncate">
              {selectedCase.caseNumber ?? 'Case'} — {selectedCase.firstParty}
            </span>
            <button
              type="button"
              onClick={() => setSelectedCase(null)}
              className="text-muted-foreground hover:text-foreground ml-2 text-base leading-none"
            >
              &times;
            </button>
          </div>
        ) : (
          <div className="relative mt-1">
            <Input
              placeholder="Search cases..."
              value={caseQuery}
              onChange={e => {
                setCaseQuery(e.target.value)
                searchCases(e.target.value)
              }}
            />
            {caseResults.length > 0 && (
              <div className="absolute z-20 w-full bg-card border border-border rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                {caseResults.map((c: any) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-secondary border-b border-border last:border-0"
                    onClick={() => {
                      setSelectedCase(c)
                      setCaseResults([])
                      setCaseQuery('')
                    }}
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
          {saving ? 'Saving...' : isEdit ? 'Update Reminder' : 'Create Reminder'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
