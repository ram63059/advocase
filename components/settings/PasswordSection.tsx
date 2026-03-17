'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsSection } from './SettingsSection'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine(d => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type Values = z.infer<typeof schema>

export function PasswordSection() {
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: Values) => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      toast.success('Password changed successfully')
      reset()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsSection id="password" title="Change Password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
        <div>
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            type="password"
            {...register('currentPassword')}
            className="mt-1"
          />
          {errors.currentPassword && (
            <p className="text-xs text-destructive mt-1">{errors.currentPassword.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            {...register('newPassword')}
            className="mt-1"
          />
          {errors.newPassword && (
            <p className="text-xs text-destructive mt-1">{errors.newPassword.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className="mt-1"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Updating...' : 'Change Password'}
        </Button>
      </form>
    </SettingsSection>
  )
}
