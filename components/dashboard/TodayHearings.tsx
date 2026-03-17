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
    <div className="bg-card rounded-xl border border-border">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <CalendarDays size={16} className="text-muted-foreground" />
          <h2 className="font-semibold text-foreground text-sm">Today&apos;s Hearings</h2>
          {cases.length > 0 && (
            <span className="bg-secondary text-foreground text-xs font-medium px-2 py-0.5 rounded-full">
              {cases.length}
            </span>
          )}
        </div>
        <Link
          href="/cases?filter=today"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight size={12} />
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
        <div className="divide-y divide-border">
          {cases.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/50 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-foreground">{c.caseNumber ?? 'No Number'}</span>
                  {c.fixedFor && (
                    <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                      {c.fixedFor}
                    </span>
                  )}
                  <CaseStatusBadge status={c.status} />
                </div>
                <p className="text-sm text-foreground mt-0.5 truncate">
                  {c.firstParty} <span className="text-muted-foreground">vs</span> {c.oppositeParty}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.courtName}</p>
              </div>
              <ArrowRight size={13} className="text-muted-foreground shrink-0 ml-4" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
