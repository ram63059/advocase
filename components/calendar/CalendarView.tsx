'use client'
import { useState } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, isSameDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Printer, Settings2 } from 'lucide-react'
import { DayPopover } from './DayPopover'
import { ColorCodeManager } from './ColorCodeManager'
import { COURT_TYPES, DEFAULT_FIXED_FOR } from '@/lib/constants'

const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  color: string
  resource: any
}

interface CalendarViewProps {
  events: CalendarEvent[]
  colorCodes: Array<{ id: string; label: string; color: string }>
  profileId: string
  searchParams: {
    year?: string
    month?: string
    courtType?: string
    fixedFor?: string
  }
}

export function CalendarView({ events, colorCodes, profileId, searchParams }: CalendarViewProps) {
  const router = useRouter()
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [date, setDate] = useState(() => {
    const year = Number(searchParams.year ?? new Date().getFullYear())
    const month = Number(searchParams.month ?? new Date().getMonth())
    return new Date(year, month, 1)
  })
  const [selectedDay, setSelectedDay] = useState<{ date: Date; events: CalendarEvent[] } | null>(null)
  const [colorManagerOpen, setColorManagerOpen] = useState(false)
  const [courtTypeFilter, setCourtTypeFilter] = useState(searchParams.courtType ?? '')
  const [fixedForFilter, setFixedForFilter] = useState(searchParams.fixedFor ?? '')

  const handleNavigate = (newDate: Date) => {
    setDate(newDate)
    const params = new URLSearchParams({
      year: String(newDate.getFullYear()),
      month: String(newDate.getMonth()),
      ...(courtTypeFilter && { courtType: courtTypeFilter }),
      ...(fixedForFilter && { fixedFor: fixedForFilter }),
    })
    router.push(`/calendar?${params.toString()}`)
  }

  const handleSelectSlot = ({ start }: { start: Date }) => {
    const dayEvents = events.filter(e => isSameDay(e.start, start))
    setSelectedDay({ date: start, events: dayEvents })
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    router.push(`/cases/${event.id}`)
  }

  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: event.color,
      borderRadius: '3px',
      border: 'none',
      color: 'white',
      fontSize: '11px',
      padding: '1px 5px',
      fontWeight: 500,
    },
  })

  const applyFilters = () => {
    const params = new URLSearchParams({
      year: String(date.getFullYear()),
      month: String(date.getMonth()),
      ...(courtTypeFilter && { courtType: courtTypeFilter }),
      ...(fixedForFilter && { fixedFor: fixedForFilter }),
    })
    router.push(`/calendar?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-foreground">Calendar</h1>

        <Select value={courtTypeFilter || '_all'} onValueChange={v => setCourtTypeFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="All Courts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Courts</SelectItem>
            {COURT_TYPES.map(ct => (
              <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={fixedForFilter || '_all'} onValueChange={v => setFixedForFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue placeholder="All Purposes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Purposes</SelectItem>
            {DEFAULT_FIXED_FOR.map(f => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="secondary" size="sm" onClick={applyFilters}>Apply</Button>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setColorManagerOpen(true)}>
            <Settings2 size={14} className="mr-1.5" />
            Color Codes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/api/export/daily-board?date=${format(date, 'yyyy-MM-dd')}`, '_blank')}
          >
            <Printer size={14} className="mr-1.5" />
            Print Day Board
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div
        className="bg-card rounded-xl border border-border overflow-hidden"
        style={{ height: 'calc(100vh - 230px)', minHeight: '500px' }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={(v) => setView(v as any)}
          date={date}
          onNavigate={handleNavigate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          eventPropGetter={eventStyleGetter}
          popup
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          style={{ height: '100%' }}
          formats={{
            eventTimeRangeFormat: () => '',
          }}
        />
      </div>

      {/* Color code legend */}
      {colorCodes.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {colorCodes.map(cc => (
            <div key={cc.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cc.color }} />
              {cc.label}
            </div>
          ))}
        </div>
      )}

      {/* Day popover */}
      {selectedDay && (
        <DayPopover
          date={selectedDay.date}
          events={selectedDay.events}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* Color code manager */}
      <ColorCodeManager
        open={colorManagerOpen}
        onClose={() => setColorManagerOpen(false)}
        profileId={profileId}
        existingCodes={colorCodes}
      />
    </div>
  )
}
