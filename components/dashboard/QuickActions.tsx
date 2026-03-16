'use client'
import Link from 'next/link'
import { Plus, Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild>
        <Link href="/cases/new">
          <Plus size={16} className="mr-2" />
          Add Case
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/cases/new?import=ecourts">
          <Download size={16} className="mr-2" />
          Import from eCourts
        </Link>
      </Button>
      <Button variant="outline" onClick={() => {
        window.open(`/api/export/daily-board?date=${new Date().toISOString().split('T')[0]}`, '_blank')
      }}>
        <FileText size={16} className="mr-2" />
        Get Daily Board
      </Button>
    </div>
  )
}
