'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SettingsSection } from './SettingsSection'
import { toast } from 'sonner'
import { COURT_TYPES } from '@/lib/constants'

interface Court {
  id: string
  courtType: string
  state: string | null
  district: string | null
  courtComplex: string | null
  barCode: string | null
  advocateName: string | null
  lastSyncedAt: Date | null
}

interface RegisteredCourtsSectionProps {
  courts: Court[]
  profileId: string
}

export function RegisteredCourtsSection({ courts: initialCourts, profileId }: RegisteredCourtsSectionProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    courtType: '',
    state: '',
    district: '',
    courtComplex: '',
    barCode: '',
    advocateName: '',
  })

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.courtType) { toast.error('Court type required'); return }
    try {
      const res = await fetch('/api/courts/registered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Court registered')
      setShowForm(false)
      setFormData({ courtType: '', state: '', district: '', courtComplex: '', barCode: '', advocateName: '' })
      router.refresh()
    } catch {
      toast.error('Failed to register court')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this registered court?')) return
    await fetch(`/api/courts/registered/${id}`, { method: 'DELETE' })
    toast.success('Court removed')
    router.refresh()
  }

  const handleSync = async (id: string) => {
    setSyncing(id)
    try {
      const res = await fetch(`/api/courts/sync/${id}`, { method: 'POST' })
      if (!res.ok) throw new Error('Sync failed')
      toast.success('Court synced successfully')
      router.refresh()
    } catch {
      toast.error('Sync failed — check court credentials')
    } finally {
      setSyncing(null)
    }
  }

  return (
    <SettingsSection
      id="courts"
      title="Registered Courts"
      description="Courts synced with eCourts for automated case updates"
    >
      {initialCourts.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Court Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Location</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Bar Code</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Last Synced</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialCourts.map(court => (
                <tr key={court.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{court.courtType}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {[court.courtComplex, court.district, court.state].filter(Boolean).join(', ') || '-'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 text-xs">{court.barCode ?? '-'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {court.lastSyncedAt
                      ? new Date(court.lastSyncedAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSync(court.id)}
                        disabled={syncing === court.id}
                        className="h-7 text-xs"
                      >
                        <RefreshCw size={12} className={`mr-1 ${syncing === court.id ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(court.id)}
                        className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleAdd} className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Court Type *</Label>
              <Select
                value={formData.courtType}
                onValueChange={v => setFormData(p => ({ ...p, courtType: v }))}
              >
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {COURT_TYPES.map(ct => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Bar Code / Advocate ID</Label>
              <Input
                value={formData.barCode}
                onChange={e => setFormData(p => ({ ...p, barCode: e.target.value }))}
                className="mt-1 h-9 font-mono text-sm"
                placeholder="Your bar number"
              />
            </div>
            <div>
              <Label className="text-xs">State</Label>
              <Input
                value={formData.state}
                onChange={e => setFormData(p => ({ ...p, state: e.target.value }))}
                className="mt-1 h-9 text-sm"
                placeholder="e.g. Delhi"
              />
            </div>
            <div>
              <Label className="text-xs">District</Label>
              <Input
                value={formData.district}
                onChange={e => setFormData(p => ({ ...p, district: e.target.value }))}
                className="mt-1 h-9 text-sm"
                placeholder="e.g. South Delhi"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Court Complex / Establishment</Label>
              <Input
                value={formData.courtComplex}
                onChange={e => setFormData(p => ({ ...p, courtComplex: e.target.value }))}
                className="mt-1 h-9 text-sm"
                placeholder="e.g. Saket District Court"
              />
            </div>
            <div>
              <Label className="text-xs">Advocate Name (as registered)</Label>
              <Input
                value={formData.advocateName}
                onChange={e => setFormData(p => ({ ...p, advocateName: e.target.value }))}
                className="mt-1 h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Register Court</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} className="mr-1.5" /> Add Court
        </Button>
      )}
    </SettingsSection>
  )
}
