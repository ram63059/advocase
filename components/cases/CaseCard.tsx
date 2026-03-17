'use client'
import Link from 'next/link'
import { Star, FileText, Receipt, ArrowRight, MapPin } from 'lucide-react'
import { CaseStatusBadge } from './CaseStatusBadge'
import { formatDate, getDateLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CaseCardProps {
  case: {
    id: string
    caseNumber: string | null
    firstParty: string | null
    oppositeParty: string | null
    courtName: string | null
    courtType: string | null
    nextDate: Date | null
    fixedFor: string | null
    status: string
    isImportant: boolean
    caseType: string | null
    year: number | null
  }
}

export function CaseCard({ case: c }: CaseCardProps) {
  const dateLabel = getDateLabel(c.nextDate)
  const isOverdue = c.nextDate && new Date(c.nextDate) < new Date() && c.status === 'running'

  return (
    <div className={cn(
      'bg-card rounded-xl border border-border hover:bg-secondary/30 transition-all',
      c.isImportant && 'border-l-[3px] border-l-foreground/40'
    )}>
      <div className="p-4">
        {/* Row 1: Type badge + Case number + Status */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {c.courtType && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase tracking-wide">
              {c.courtType}
            </span>
          )}
          {c.caseType && (
            <span className="text-xs text-muted-foreground">{c.caseType}</span>
          )}
          <span className="font-mono text-sm text-foreground font-medium">
            {c.caseNumber ?? 'No Number'} {c.year ? `/ ${c.year}` : ''}
          </span>
          {c.isImportant && (
            <Star size={13} className="text-foreground/60 fill-foreground/20 ml-auto" />
          )}
          <CaseStatusBadge status={c.status} className="ml-auto" />
        </div>

        {/* Row 2: Parties */}
        <h3 className="text-sm font-medium text-foreground truncate">
          {c.firstParty ?? '—'} <span className="font-normal text-muted-foreground">vs</span> {c.oppositeParty ?? '—'}
        </h3>

        {/* Row 3: Court + Date + Fixed For */}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
          {c.courtName && (
            <span className="flex items-center gap-1">
              <MapPin size={10} />
              {c.courtName}
            </span>
          )}
          {c.nextDate && (
            <span className={cn('font-medium', isOverdue ? 'text-destructive' : 'text-foreground/70')}>
              {dateLabel} ({formatDate(c.nextDate, 'dd MMM')})
            </span>
          )}
          {!c.nextDate && c.status === 'running' && (
            <span className="text-muted-foreground font-medium">Date Awaited</span>
          )}
          {c.fixedFor && (
            <span className="bg-secondary px-2 py-0.5 rounded-full">{c.fixedFor}</span>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
        <div className="flex items-center gap-3">
          <Link
            href={`/cases/${c.id}#notes`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText size={11} />
            Notes
          </Link>
          <Link
            href={`/cases/${c.id}#fees`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Receipt size={11} />
            Fees
          </Link>
        </div>
        <Link
          href={`/cases/${c.id}`}
          className="flex items-center gap-1 text-xs text-foreground font-medium hover:underline"
        >
          View <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  )
}
