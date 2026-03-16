'use client'
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { DEFAULT_FIXED_FOR } from '@/lib/constants'

interface ColorCode {
  id: string
  label: string
  color: string
}

interface ColorCodeManagerProps {
  open: boolean
  onClose: () => void
  profileId: string
  existingCodes: ColorCode[]
}

export function ColorCodeManager({ open, onClose, existingCodes }: ColorCodeManagerProps) {
  const router = useRouter()
  const [codes, setCodes] = useState<ColorCode[]>(existingCodes)
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState('#4F46E5')
  const [saving, setSaving] = useState(false)

  const addCode = async () => {
    if (!newLabel.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/color-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel.trim(), color: newColor }),
      })
      if (!res.ok) throw new Error('Failed')
      const newCode = await res.json()
      // If label already exists, replace it in local state
      setCodes(prev => {
        const exists = prev.findIndex(c => c.label === newCode.label)
        if (exists >= 0) {
          const updated = [...prev]
          updated[exists] = newCode
          return updated
        }
        return [...prev, newCode]
      })
      setNewLabel('')
      setNewColor('#4F46E5')
      toast.success('Color code saved')
      router.refresh()
    } catch {
      toast.error('Failed to add color code')
    } finally {
      setSaving(false)
    }
  }

  const deleteCode = async (id: string) => {
    try {
      await fetch(`/api/color-codes/${id}`, { method: 'DELETE' })
      setCodes(prev => prev.filter(c => c.id !== id))
      toast.success('Color code removed')
      router.refresh()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Calendar Color Codes</SheetTitle>
        </SheetHeader>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Assign colors to "Fixed For" labels for the calendar.
        </p>

        <div className="space-y-4">
          {/* Existing codes */}
          {codes.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No color codes configured yet.</p>
          ) : (
            codes.map(code => (
              <div key={code.id} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded border border-slate-200" style={{ backgroundColor: code.color }} />
                <span className="text-sm flex-1 text-slate-700">{code.label}</span>
                <button
                  onClick={() => deleteCode(code.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}

          {/* Add new code */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Add Color Code</p>
            <div>
              <Label htmlFor="newLabel">Label (Fixed For value)</Label>
              <Input
                id="newLabel"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. For Arguments"
                list="fixed-for-options"
                className="mt-1"
              />
              <datalist id="fixed-for-options">
                {DEFAULT_FIXED_FOR.map(f => <option key={f} value={f} />)}
              </datalist>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-slate-200 p-0.5"
                />
                <Input
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  className="font-mono w-32"
                  placeholder="#4F46E5"
                />
              </div>
            </div>
            <Button onClick={addCode} disabled={saving || !newLabel.trim()} size="sm">
              <Plus size={14} className="mr-1" />
              {saving ? 'Saving...' : 'Add Color Code'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
