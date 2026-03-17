'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const schema = z.object({
  fullName: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  mobile: z.string().optional(),
  role: z.enum(['associate', 'partner', 'junior', 'clerk']).default('associate'),
  canAddCase: z.boolean().default(true),
  canEditCase: z.boolean().default(false),
  canViewCase: z.boolean().default(true),
  canViewFees: z.boolean().default(false),
})

type FormValues = z.infer<typeof schema>

const PERMISSIONS = [
  { key: 'canAddCase' as const, label: 'Add Cases' },
  { key: 'canEditCase' as const, label: 'Edit Cases' },
  { key: 'canViewCase' as const, label: 'View Cases' },
  { key: 'canViewFees' as const, label: 'View Fees' },
]

interface TeamMemberFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function TeamMemberForm({ onSuccess, onCancel }: TeamMemberFormProps) {
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'associate',
      canAddCase: true,
      canEditCase: false,
      canViewCase: true,
      canViewFees: false,
    },
  })

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed')
      }
      toast.success('Invitation sent successfully')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to invite member')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full Name *</Label>
        <Input id="fullName" {...register('fullName')} placeholder="e.g. Rahul Sharma" className="mt-1" />
        {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input id="email" type="email" {...register('email')} placeholder="member@email.com" className="mt-1" />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="mobile">Mobile</Label>
        <Input id="mobile" {...register('mobile')} placeholder="Optional" className="mt-1" />
      </div>

      <div>
        <Label>Role</Label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="associate">Associate</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="junior">Junior</SelectItem>
                <SelectItem value="clerk">Clerk</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label className="block text-sm font-medium">Permissions</Label>
        {PERMISSIONS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <Controller
              control={control}
              name={key}
              render={({ field }) => (
                <Checkbox
                  id={key}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <label htmlFor={key} className="text-sm text-foreground cursor-pointer">
              {label}
            </label>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Sending Invite...' : 'Send Invitation'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
