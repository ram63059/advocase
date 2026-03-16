'use client'
import Link from 'next/link'
import { CalendarDays, ArrowRight } from 'lucide-react'
import { CaseStatusBadge } from '@/components/cases/CaseStatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'

interface TodayCase {
  id: string
  caseNumber: string | null
  firstParty: string | null
  oppositeParty: string | null
  courtName: string | null
  fixedFor: string | null
  status: string
  courtType: string | null
}

export function TodayHearings({ cases }: { cases: TodayCase[] }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-indigo-600" />
          <h2 className="font-semibold text-slate-900">Today&apos;s Hearings</h2>
          {cases.length > 0 && (
            <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {cases.length}
            </span>
          )}
        </div>
        <Link
          href="/cases?filter=today"
          className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      {cases.length === 0 ? (
        <div className="py-10">
          <EmptyState
            icon={CalendarDays}
            title="No hearings today"
            description="You have no cases scheduled for today."
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {cases.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-slate-700">{c.caseNumber ?? 'No Number'}</span>
                  {c.fixedFor && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {c.fixedFor}
                    </span>
                  )}
                  <CaseStatusBadge status={c.status} />
                </div>
                <p className="text-sm text-slate-900 mt-0.5 truncate">
                  {c.firstParty} <span className="text-slate-400">vs</span> {c.oppositeParty}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{c.courtName}</p>
              </div>
              <ArrowRight size={14} className="text-slate-400 shrink-0 ml-4" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
