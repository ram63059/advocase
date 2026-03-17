'use client'
import Link from 'next/link'
import { format, isToday } from 'date-fns'
import { cn } from '@/lib/utils'

interface DayCount { date: Date; count: number }

export function SevenDayStrip({ days }: { days: DayCount[] }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="font-semibold text-foreground text-sm mb-4">Next 7 Days</h2>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(({ date, count }, i) => {
          const today = isToday(date)
          const dateStr = format(date, 'yyyy-MM-dd')
          return (
            <Link
              key={i}
              href={`/cases?date=${dateStr}`}
              className={cn(
                'flex flex-col items-center p-2 rounded-lg transition-colors',
                today
                  ? 'bg-foreground'
                  : count > 0
                  ? 'bg-secondary hover:bg-secondary/70'
                  : 'hover:bg-secondary'
              )}
            >
              <span className={cn(
                'text-[10px] font-medium uppercase tracking-wide',
                today ? 'text-background/60' : 'text-muted-foreground'
              )}>
                {format(date, 'EEE')}
              </span>
              <span className={cn(
                'text-base font-semibold mt-0.5',
                today ? 'text-background' : 'text-foreground'
              )}>
                {format(date, 'd')}
              </span>
              {count > 0 && (
                <span className={cn(
                  'text-[10px] font-semibold mt-1 w-4 h-4 rounded-full flex items-center justify-center',
                  today ? 'bg-background/20 text-background' : 'bg-foreground text-background'
                )}>
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
