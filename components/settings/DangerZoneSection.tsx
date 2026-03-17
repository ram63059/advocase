'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SettingsSection } from './SettingsSection'
import { signOut } from 'next-auth/react'

export function DangerZoneSection({ profileId }: { profileId: string }) {
  const router = useRouter()
  const [showDeleteForm, setShowDeleteForm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleExportData = () => {
    window.open('/api/export/my-data', '_blank')
  }

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Account deleted')
      await signOut({ callbackUrl: '/login' })
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <SettingsSection id="danger" title="Danger Zone">
      <div className="space-y-4">
        {/* Export data */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Export All Data</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Download all your cases, clients, tasks, and reminders as JSON
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download size={14} className="mr-1.5" />
            Export JSON
          </Button>
        </div>

        {/* Delete account */}
        <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                <AlertTriangle size={14} />
                Delete Account
              </p>
              <p className="text-xs text-destructive/70 mt-0.5">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
            </div>
            {!showDeleteForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteForm(true)}
                className="border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
              >
                <Trash2 size={14} className="mr-1.5" />
                Delete Account
              </Button>
            )}
          </div>

          {showDeleteForm && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-destructive/80">
                Type <strong>DELETE</strong> to confirm account deletion:
              </p>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="max-w-xs border-destructive/30"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={confirmText !== 'DELETE' || deleting}
                  onClick={handleDeleteAccount}
                >
                  {deleting ? 'Deleting...' : 'Permanently Delete'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowDeleteForm(false); setConfirmText('') }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SettingsSection>
  )
}
