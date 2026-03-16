'use client'
import Link from 'next/link'
import { format, isToday } from 'date-fns'
import { cn } from '@/lib/utils'

interface DayCount { date: Date; count: number }

export function SevenDayStrip({ days }: { days: DayCount[] }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-900 mb-4">Next 7 Days</h2>
      <div className="grid grid-cols-7 gap-2">
        {days.map(({ date, count }, i) => {
          const today = isToday(date)
          const dateStr = format(date, 'yyyy-MM-dd')
          return (
            <Link
              key={i}
              href={`/cases?date=${dateStr}`}
              className={cn(
                'flex flex-col items-center p-2 rounded-lg transition-colors',
                today ? 'bg-indigo-600' : count > 0 ? 'bg-indigo-50 hover:bg-indigo-100' : 'bg-slate-50 hover:bg-slate-100'
              )}
            >
              <span className={cn('text-xs font-medium', today ? 'text-indigo-200' : 'text-slate-500')}>
                {format(date, 'EEE')}
              </span>
              <span className={cn('text-lg font-bold mt-0.5', today ? 'text-white' : 'text-slate-900')}>
                {format(date, 'd')}
              </span>
              {count > 0 && (
                <span className={cn(
                  'text-xs font-medium mt-1 w-5 h-5 rounded-full flex items-center justify-center',
                  today ? 'bg-indigo-500 text-white' : 'bg-indigo-600 text-white'
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
