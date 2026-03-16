# Stage 15: Settings Page

## Goal
Build `/settings` — a single scrollable page with 7 sections: profile, branding, bank details, password, registered courts, subscription, and danger zone.

---

## File: `app/(dashboard)/settings/page.tsx`

Server Component — loads profile data.

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { SettingsPageClient } from '@/components/settings/SettingsPageClient'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [profile, courts] = await Promise.all([
    prisma.profile.findUnique({ where: { id: session.user.id } }),
    prisma.courtRegistered.findMany({
      where: { profileId: session.user.id },
      orderBy: { createdAt: 'asc' }
    })
  ])

  if (!profile) redirect('/login')

  return <SettingsPageClient profile={profile} courts={courts} />
}
```

---

## `components/settings/SettingsPageClient.tsx`

```typescript
'use client'
import { useRef } from 'react'

// Renders all 7 sections as one scrollable page
// Each section is wrapped in <SettingsSection title="...">

export function SettingsPageClient({ profile, courts }) {
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <ProfileSection profile={profile} />
      <BrandingSection profile={profile} />
      <BankDetailsSection profile={profile} />
      <PasswordSection />
      <RegisteredCourtsSection courts={courts} profileId={profile.id} />
      <SubscriptionSection plan={profile.plan} planExpiresAt={profile.planExpiresAt} />
      <DangerZoneSection profileId={profile.id} />
    </div>
  )
}
```

---

## Section 1: Profile (`components/settings/ProfileSection.tsx`)

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const profileSchema = z.object({
  fullName:     z.string().min(2),
  officeName:   z.string().optional(),
  officeAddress: z.string().optional(),
  mobile:       z.string().optional(),
})

export function ProfileSection({ profile }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName:      profile.fullName ?? '',
      officeName:    profile.officeName ?? '',
      officeAddress: profile.officeAddress ?? '',
      mobile:        profile.mobile ?? '',
    }
  })

  const onSubmit = async (values) => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Profile updated')
      router.refresh()
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true)
    try {
      // Upload via server-side API route (uses Supabase service role)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'profile-assets')
      formData.append('path', `${profile.id}/logo.${file.name.split('.').pop()}`)

      const res = await fetch('/api/storage/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()

      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: url }),
      })
      toast.success('Logo updated')
      router.refresh()
    } catch {
      toast.error('Failed to upload logo')
    } finally {
      setAvatarUploading(false)
    }
  }

  return (
    <SettingsSection title="Profile" description="Your basic information">
      {/* Avatar upload */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.logoUrl ?? undefined} />
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg">
              {getInitials(profile.fullName ?? 'A')}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50"
          >
            <Camera size={13} className="text-slate-600" />
          </button>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">Profile photo</p>
          <p className="text-xs text-slate-500">PNG, JPG. Max 2MB</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Full Name *</Label>
            <Input {...register('fullName')} />
          </div>
          <div>
            <Label>Mobile</Label>
            <Input {...register('mobile')} />
          </div>
        </div>
        <div>
          <Label>Email</Label>
          <Input value={profile.email} readOnly className="bg-slate-50 text-slate-500" />
          <p className="text-xs text-slate-400 mt-1">Email cannot be changed here</p>
        </div>
        <div>
          <Label>Office / Chamber Name</Label>
          <Input {...register('officeName')} placeholder="e.g. The Law Office" />
        </div>
        <div>
          <Label>Office Address</Label>
          <Textarea {...register('officeAddress')} rows={2} placeholder="Court campus, city, PIN" />
        </div>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving…' : 'Save Profile'}
        </Button>
      </form>
    </SettingsSection>
  )
}
```

---

## Section 2: Branding

```typescript
// BrandingSection: upload Logo + QR Code
// Files stored in Supabase Storage: profile-assets/{profileId}/logo.png, qr.png
// Shows preview after upload
// Logo used in PDF exports (daily board, invoice)
// QR code used in invoice footer for payment
```

---

## Section 3: Bank Details

```typescript
// BankDetailsSection: form with 5 fields
// bankName, bankAccountName, bankIfsc, bankAccountNo, upiId
// Used in invoice PDF generation
// Saved via PATCH /api/profile
```

---

## Section 4: Password

```typescript
// PasswordSection: change password
// Fields: Current Password, New Password, Confirm New Password
// On submit → POST /api/profile/change-password with { currentPassword, newPassword }
// API route: verify currentPassword with bcrypt.compare, then bcrypt.hash + prisma.update
// Show success toast on 200, show error message on 400
```

### `app/api/profile/change-password/route.ts`

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await request.json()
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  })

  const valid = profile?.passwordHash
    ? await bcrypt.compare(currentPassword, profile.passwordHash)
    : false

  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

  await prisma.profile.update({
    where: { id: session.user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  })

  return NextResponse.json({ success: true })
}
```

---

## Section 5: Registered Courts

```typescript
// RegisteredCourtsSection
// Table: Court Type, Complex/Establishment, Bar Code, State, Last Synced, Actions
// Sync button per court → POST /api/courts/sync
// "Add Court" button → opens CourtRegistrationModal
// Delete court → DELETE /api/courts/registered/[id]

// CourtRegistrationModal:
//   Step 1: Select court type (District, HC, SC, DRT, NCLT, Consumer)
//   Step 2 (District only): State → District → Court Complex → Establishment cascade dropdowns
//             These call: /api/courts/states → /api/courts/districts → /api/courts/complexes
//   Step 3: Enter Bar Code / Advocate Name / Year (varies by court type)
//   Step 4: "Test Connection" → calls eCourts API to verify
//   Step 5: Save → creates CourtRegistered record
```

---

## Section 6: Subscription

```typescript
// SubscriptionSection
// Shows: current plan badge (free/basic/pro)
// Shows plan details:
//   Free: 50 cases, 20 clients, no team members
//   Basic: 500 cases, 200 clients, 2 team members
//   Pro: Unlimited cases, unlimited clients, 10 team members
// Shows: plan expires at (if applicable)
// "Upgrade" button → links to payment (future Razorpay/Stripe integration)
// Plan limits enforced at API level (check before creating cases/clients)
```

---

## Section 7: Danger Zone

```typescript
// DangerZoneSection
// "Export All My Data" → GET /api/export/my-data (returns JSON of all cases, clients, etc.)
// "Delete Account" → confirmation dialog
//   Text: "This will permanently delete all your data. Type DELETE to confirm."
//   On confirm: POST /api/account/delete → deletes all records via Prisma (cascades handle relations)
```

---

## Shared: `components/settings/SettingsSection.tsx`

```typescript
interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  id?: string
}

export function SettingsSection({ title, description, children, id }: SettingsSectionProps) {
  return (
    <div id={id} className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}
```

---

## API Routes

### `app/api/profile/route.ts`
```typescript
// GET: get current user's profile
// PATCH: update profile fields
//   Allowed fields: fullName, officeName, officeAddress, mobile,
//                   logoUrl, qrCodeUrl, bankName, bankAccountName,
//                   bankIfsc, bankAccountNo, upiId
//   Validates with Zod
//   Uses: prisma.profile.update({ where: { id: userId }, data: { ...body } })
```

### `app/api/courts/registered/route.ts`
```typescript
// GET: list registered courts for current user
// POST: create new registered court
//   Body: { courtType, state, district, courtComplex, establishment, barCode, year, advocateName }
```

### `app/api/courts/registered/[id]/route.ts`
```typescript
// DELETE: remove registered court
// PATCH: update registered court (e.g. barCode, advocateName)
```

### `app/api/account/delete/route.ts`
```typescript
// POST: delete account
//   1. Verify confirmation code in body
//   2. Delete all Supabase Storage files (use service role key)
//   3. prisma.profile.delete({ where: { id: userId } }) — cascades delete all related data
//   4. Return 200 (NextAuth session will expire naturally after profile is gone)
```

### `app/api/export/my-data/route.ts`
```typescript
// GET: export all user data as JSON
//   Fetches: cases, clients, tasks, reminders, fees, notes, documents metadata
//   Returns JSON attachment with content-disposition: attachment
```

---

## Verification Checklist
- [ ] Profile form saves name, office, mobile, address
- [ ] Avatar upload works and shows preview
- [ ] Email field is read-only
- [ ] Branding: logo and QR uploads work
- [ ] Bank details save correctly
- [ ] Password change works (verifies current, updates new)
- [ ] Registered courts table shows sync status and last synced time
- [ ] Add Court modal step-by-step works
- [ ] Sync button triggers court sync
- [ ] Subscription section shows correct plan limits
- [ ] Export data downloads JSON file
- [ ] Delete account requires typed confirmation
- [ ] All sections have proper id= for anchor navigation (#courts, #subscription, etc.)
