'use client'
import Link from 'next/link'
import { Plus, Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm">
        <Link href="/cases/new">
          <Plus size={14} className="mr-1.5" />
          Add Case
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/cases/new?import=ecourts">
          <Download size={14} className="mr-1.5" />
          Import from eCourts
        </Link>
      </Button>
      <Button variant="outline" size="sm" onClick={() => {
        window.open(`/api/export/daily-board?date=${new Date().toISOString().split('T')[0]}`, '_blank')
      }}>
        <FileText size={14} className="mr-1.5" />
        Daily Board
      </Button>
    </div>
  )
}
