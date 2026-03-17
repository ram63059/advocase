'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsSection } from './SettingsSection'

export function BankDetailsSection({ profile }: { profile: any }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit } = useForm({
    defaultValues: {
      bankName: profile.bankName ?? '',
      bankAccountName: profile.bankAccountName ?? '',
      bankIfsc: profile.bankIfsc ?? '',
      bankAccountNo: profile.bankAccountNo ?? '',
      upiId: profile.upiId ?? '',
    },
  })

  const onSubmit = async (values: any) => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Bank details saved')
      router.refresh()
    } catch {
      toast.error('Failed to save bank details')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsSection
      id="bank"
      title="Bank Details"
      description="Used in fee receipts and invoice PDF generation"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bankName">Bank Name</Label>
            <Input id="bankName" {...register('bankName')} placeholder="e.g. State Bank of India" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="bankAccountName">Account Holder Name</Label>
            <Input id="bankAccountName" {...register('bankAccountName')} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="bankAccountNo">Account Number</Label>
            <Input id="bankAccountNo" {...register('bankAccountNo')} className="mt-1 font-mono" />
          </div>
          <div>
            <Label htmlFor="bankIfsc">IFSC Code</Label>
            <Input
              id="bankIfsc"
              {...register('bankIfsc')}
              placeholder="e.g. SBIN0001234"
              className="mt-1 font-mono uppercase"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="upiId">UPI ID</Label>
          <Input id="upiId" {...register('upiId')} placeholder="name@upi" className="mt-1" />
          <p className="text-xs text-muted-foreground/60 mt-1">Used to generate QR code in invoice footer</p>
        </div>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving...' : 'Save Bank Details'}
        </Button>
      </form>
    </SettingsSection>
  )
}
