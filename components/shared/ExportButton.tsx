'use client'
import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface ExportButtonProps {
  type: 'cases'
  filters: Record<string, string | undefined>
}

export function ExportButton({ type, filters }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const exportAs = async (format: 'pdf' | 'excel') => {
    setLoading(true)
    try {
      const cleanFilters: Record<string, string> = {}
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined) cleanFilters[k] = v
      })
      const params = new URLSearchParams(cleanFilters).toString()
      const url = format === 'pdf'
        ? `/api/export/cases-pdf?${params}`
        : `/api/export/cases-excel?${params}`
      window.open(url, '_blank')
    } catch {
      toast.error('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1" disabled={loading}>
          <Download size={14} />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportAs('pdf')}>Export as PDF</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAs('excel')}>Export as Excel</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
