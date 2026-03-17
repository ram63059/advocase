'use client'
import { RefreshCw, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

interface CourtRegisteredItem {
  id: string
  courtType: string
  courtComplex: string | null
  establishment: string | null
  state: string | null
  lastSyncedAt: Date | null
  syncStatus: string
}

export function RegisteredCourts({ courts }: { courts: CourtRegisteredItem[] }) {
  const [syncing, setSyncing] = useState<string | null>(null)

  const handleSync = async (courtId: string) => {
    setSyncing(courtId)
    try {
      const res = await fetch('/api/courts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ court_id: courtId }),
      })
      if (!res.ok) throw new Error('Sync failed')
      toast.success('Sync started! Cases will update shortly.')
    } catch {
      toast.error('Sync failed. Please try again.')
    } finally {
      setSyncing(null)
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-foreground text-sm">Registered Courts</h2>
        <Button variant="outline" size="sm" asChild className="h-7 text-xs">
          <Link href="/settings#courts">
            <Plus size={12} className="mr-1" />
            Add Court
          </Link>
        </Button>
      </div>

      {courts.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">No courts registered yet.</p>
          <Button size="sm" className="mt-3" asChild>
            <Link href="/settings#courts">Register a court for auto-sync</Link>
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {courts.map((court) => (
            <div key={court.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {court.establishment ?? court.courtComplex ?? court.courtType}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {court.state} &bull; Last synced: {court.lastSyncedAt ? formatDate(court.lastSyncedAt) : 'Never'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSync(court.id)}
                disabled={syncing === court.id}
                className="gap-1.5 h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw size={13} className={syncing === court.id ? 'animate-spin' : ''} />
                {syncing === court.id ? 'Syncing...' : 'Sync'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
