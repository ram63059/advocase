'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

const clientSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  mobile: z.string().optional(),
  address: z.string().optional(),
  dpdpConsent: z.boolean().default(false),
})

type ClientValues = z.infer<typeof clientSchema>

interface ClientFormProps {
  defaultValues?: Partial<ClientValues> & { id?: string }
  onSuccess: (client: any) => void
  onCancel: () => void
}

export function ClientForm({ defaultValues, onSuccess, onCancel }: ClientFormProps) {
  const [saving, setSaving] = useState(false)
  const isEdit = !!defaultValues?.id

  const { register, handleSubmit, control, formState: { errors } } = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: defaultValues ?? { dpdpConsent: false },
  })

  const onSubmit = async (values: ClientValues) => {
    setSaving(true)
    try {
      const url = isEdit ? `/api/clients/${defaultValues!.id}` : '/api/clients'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      toast.success(isEdit ? 'Client updated' : 'Client added')
      onSuccess(data)
    } catch {
      toast.error('Failed to save client')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full Name *</Label>
        <Input id="fullName" {...register('fullName')} placeholder="e.g. Ravi Kumar" className="mt-1" />
        {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
      </div>
      <div>
        <Label htmlFor="mobile">Mobile</Label>
        <Input id="mobile" {...register('mobile')} placeholder="10-digit mobile number" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} placeholder="client@email.com" className="mt-1" />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" {...register('address')} rows={2} placeholder="Client address" className="mt-1" />
      </div>
      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="dpdpConsent"
          render={({ field }) => (
            <Checkbox
              id="dpdp"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <label htmlFor="dpdp" className="text-xs text-muted-foreground cursor-pointer">
          Client has given DPDP consent to store their data
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Saving...' : isEdit ? 'Update Client' : 'Add Client'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
