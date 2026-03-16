'use client'
import { format } from 'date-fns'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import Link from 'next/link'
import { ArrowRight, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DayPopoverProps {
  date: Date
  events: Array<{
    id: string
    resource: {
      caseNumber: string | null
      firstParty: string | null
      oppositeParty: string | null
      courtName: string | null
      fixedFor: string | null
    }
    color: string
  }>
  onClose: () => void
}

export function DayPopover({ date, events, onClose }: DayPopoverProps) {
  const dateStr = format(date, 'yyyy-MM-dd')

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between pr-6">
            <SheetTitle className="text-base">
              {format(date, 'EEEE, dd MMMM yyyy')}
              <span className="ml-2 text-sm font-normal text-slate-500">
                {events.length} {events.length === 1 ? 'case' : 'cases'}
              </span>
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/api/export/daily-board?date=${dateStr}`, '_blank')}
            >
              <Printer size={14} className="mr-1" />
              Print
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-3 overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No cases scheduled for this day.</p>
          ) : (
            events.map(event => (
              <Link
                key={event.id}
                href={`/cases/${event.id}`}
                className="block p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                      <span className="font-mono text-sm text-slate-700 font-medium">
                        {event.resource.caseNumber ?? 'No number'}
                      </span>
                      {event.resource.fixedFor && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {event.resource.fixedFor}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-900 mt-1 truncate">
                      {event.resource.firstParty}{' '}
                      <span className="text-slate-400">vs</span>{' '}
                      {event.resource.oppositeParty}
                    </p>
                    {event.resource.courtName && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{event.resource.courtName}</p>
                    )}
                  </div>
                  <ArrowRight size={14} className="text-slate-400 mt-1 shrink-0 ml-2" />
                </div>
              </Link>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
