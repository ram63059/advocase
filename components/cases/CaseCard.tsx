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

const COURT_TYPE_COLORS: Record<string, string> = {
  district: 'bg-indigo-100 text-indigo-700',
  hc: 'bg-sky-100 text-sky-700',
  sc: 'bg-amber-100 text-amber-700',
  drt: 'bg-emerald-100 text-emerald-700',
  nclt: 'bg-purple-100 text-purple-700',
  consumer: 'bg-red-100 text-red-700',
  other: 'bg-slate-100 text-slate-700',
}

export function CaseCard({ case: c }: CaseCardProps) {
  const dateLabel = getDateLabel(c.nextDate)
  const isOverdue = c.nextDate && new Date(c.nextDate) < new Date() && c.status === 'running'

  return (
    <div className={cn(
      'bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all',
      c.isImportant && 'border-l-4 border-l-amber-400'
    )}>
      <div className="p-4">
        {/* Row 1: Type badge + Case number + Important star */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {c.courtType && (
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
              COURT_TYPE_COLORS[c.courtType] ?? COURT_TYPE_COLORS.other
            )}>
              {c.courtType.toUpperCase()}
            </span>
          )}
          {c.caseType && (
            <span className="text-xs text-slate-500">{c.caseType}</span>
          )}
          <span className="font-mono text-sm text-slate-700 font-medium">
            {c.caseNumber ?? 'No Number'} {c.year ? `/ ${c.year}` : ''}
          </span>
          {c.isImportant && (
            <Star size={14} className="text-amber-500 fill-amber-500 ml-auto" />
          )}
          <CaseStatusBadge status={c.status} className="ml-auto" />
        </div>

        {/* Row 2: Parties */}
        <h3 className="text-sm font-semibold text-slate-900 truncate">
          {c.firstParty ?? '—'} <span className="font-normal text-slate-400">vs</span> {c.oppositeParty ?? '—'}
        </h3>

        {/* Row 3: Court + Date + Fixed For */}
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
          {c.courtName && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {c.courtName}
            </span>
          )}
          {c.nextDate && (
            <span className={cn('font-medium', isOverdue ? 'text-red-600' : 'text-slate-600')}>
              {dateLabel} ({formatDate(c.nextDate, 'dd MMM')})
            </span>
          )}
          {!c.nextDate && c.status === 'running' && (
            <span className="text-amber-600 font-medium">Date Awaited</span>
          )}
          {c.fixedFor && (
            <span className="bg-slate-100 px-2 py-0.5 rounded-full">{c.fixedFor}</span>
          )}
        </div>
      </div>

      {/* Row 4: Actions footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <Link
            href={`/cases/${c.id}#notes`}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <FileText size={12} />
            Notes
          </Link>
          <Link
            href={`/cases/${c.id}#fees`}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <Receipt size={12} />
            Fees
          </Link>
        </div>
        <Link
          href={`/cases/${c.id}`}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}
