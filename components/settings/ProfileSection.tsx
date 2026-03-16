'use client'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SettingsSection } from './SettingsSection'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name required'),
  officeName: z.string().optional(),
  officeAddress: z.string().optional(),
  mobile: z.string().optional(),
})

type ProfileValues = z.infer<typeof profileSchema>

export function ProfileSection({ profile }: { profile: any }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.fullName ?? '',
      officeName: profile.officeName ?? '',
      officeAddress: profile.officeAddress ?? '',
      mobile: profile.mobile ?? '',
    },
  })

  const onSubmit = async (values: ProfileValues) => {
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
    <SettingsSection id="profile" title="Profile" description="Your basic information">
      {/* Avatar upload */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.logoUrl ?? undefined} />
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-semibold">
              {getInitials(profile.fullName ?? 'A')}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Camera size={13} className="text-slate-600" />
          </button>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">Profile / Logo</p>
          <p className="text-xs text-slate-500">PNG, JPG. Max 2MB. Used in PDF exports.</p>
          {avatarUploading && (
            <p className="text-xs text-indigo-600 mt-1">Uploading...</p>
          )}
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
            <Label htmlFor="fullName">Full Name *</Label>
            <Input id="fullName" {...register('fullName')} className="mt-1" />
            {errors.fullName && (
              <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="mobile">Mobile</Label>
            <Input id="mobile" {...register('mobile')} className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Email</Label>
          <Input value={profile.email} readOnly className="mt-1 bg-slate-50 text-slate-500 cursor-not-allowed" />
          <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
        </div>
        <div>
          <Label htmlFor="officeName">Office / Chamber Name</Label>
          <Input
            id="officeName"
            {...register('officeName')}
            placeholder="e.g. The Law Office"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="officeAddress">Office Address</Label>
          <Textarea
            id="officeAddress"
            {...register('officeAddress')}
            rows={2}
            placeholder="Court campus, city, PIN"
            className="mt-1"
          />
        </div>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </form>
    </SettingsSection>
  )
}
