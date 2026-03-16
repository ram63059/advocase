# Stage 10: Calendar Page

## Goal
Build `/calendar` using `react-big-calendar` with month/week/day views, color-coded events by "Fixed For" label, day click popup, filter controls, and print support.

---

## Files to Create
- `app/(dashboard)/calendar/page.tsx`
- `components/calendar/CalendarView.tsx`
- `components/calendar/DayPopover.tsx`
- `components/calendar/ColorCodeManager.tsx`

---

## Step 1: Calendar Page (`app/(dashboard)/calendar/page.tsx`)

Server Component — fetch all cases with next dates + color codes.

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CalendarView } from '@/components/calendar/CalendarView'
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'

interface CalendarPageProps {
  searchParams: {
    year?: string
    month?: string  // 0-indexed
    courtType?: string
    fixedFor?: string
  }
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.userId

  const profileId = userId
  const now = new Date()
  const year = Number(searchParams.year ?? now.getFullYear())
  const month = Number(searchParams.month ?? now.getMonth())
  const currentMonth = new Date(year, month, 1)

  // Load 3 months around current (prev, current, next) for smooth navigation
  const rangeStart = startOfMonth(subMonths(currentMonth, 1))
  const rangeEnd = endOfMonth(addMonths(currentMonth, 1))

  const [cases, colorCodes] = await Promise.all([
    prisma.case.findMany({
      where: {
        profileId,
        nextDate: { gte: rangeStart, lte: rangeEnd },
        status: { not: 'abandoned' },
        ...(searchParams.courtType && { courtType: searchParams.courtType }),
        ...(searchParams.fixedFor && { fixedFor: searchParams.fixedFor }),
      },
      select: {
        id: true,
        caseNumber: true,
        firstParty: true,
        oppositeParty: true,
        courtName: true,
        courtType: true,
        nextDate: true,
        fixedFor: true,
        status: true,
      }
    }),
    prisma.colorCode.findMany({
      where: { profileId },
    })
  ])

  // Build color map: fixedFor label → hex color
  const colorMap = Object.fromEntries(colorCodes.map(cc => [cc.label, cc.color]))

  // Convert cases to calendar events
  const events = cases.map(c => ({
    id: c.id,
    title: `${c.caseNumber ?? '—'} • ${c.firstParty}`,
    start: new Date(c.nextDate!),
    end: new Date(c.nextDate!),
    resource: c,
    color: colorMap[c.fixedFor ?? ''] ?? '#4F46E5',  // default indigo
  }))

  return (
    <CalendarView
      events={events}
      colorCodes={colorCodes}
      profileId={profileId}
      searchParams={searchParams}
    />
  )
}
```

---

## Step 2: CalendarView (`components/calendar/CalendarView.tsx`)

```typescript
'use client'
import { useState, useMemo } from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Printer, Settings2 } from 'lucide-react'
import { DayPopover } from './DayPopover'
import { ColorCodeManager } from './ColorCodeManager'
import { COURT_TYPES, DEFAULT_FIXED_FOR } from '@/lib/constants'

const localizer = momentLocalizer(moment)

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  color: string
  resource: any
}

export function CalendarView({ events, colorCodes, profileId, searchParams }) {
  const router = useRouter()
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [date, setDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<{ date: Date; events: CalendarEvent[] } | null>(null)
  const [colorManagerOpen, setColorManagerOpen] = useState(false)
  const [courtTypeFilter, setCourtTypeFilter] = useState(searchParams.courtType ?? '')
  const [fixedForFilter, setFixedForFilter] = useState(searchParams.fixedFor ?? '')

  const handleNavigate = (newDate: Date) => {
    setDate(newDate)
    router.push(`/calendar?year=${newDate.getFullYear()}&month=${newDate.getMonth()}${courtTypeFilter ? `&courtType=${courtTypeFilter}` : ''}`)
  }

  const handleSelectSlot = ({ start, slots }: { start: Date; slots: Date[] }) => {
    const dayEvents = events.filter(e => moment(e.start).isSame(start, 'day'))
    if (dayEvents.length > 0 || slots.length === 1) {
      setSelectedDay({ date: start, events: dayEvents })
    }
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    router.push(`/cases/${event.id}`)
  }

  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: event.color,
      borderRadius: '4px',
      border: 'none',
      color: 'white',
      fontSize: '11px',
      padding: '1px 4px',
    }
  })

  const handlePrint = () => {
    const dateStr = moment(date).format('YYYY-MM-DD')
    window.open(`/api/export/daily-board?date=${dateStr}`, '_blank')
  }

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
    <div className="space-y-4 h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 mr-2">Calendar</h1>

        {/* Court type filter */}
        <Select value={courtTypeFilter} onValueChange={setCourtTypeFilter}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="All courts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Courts</SelectItem>
            {COURT_TYPES.map(ct => (
              <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Fixed For filter */}
        <Select value={fixedForFilter} onValueChange={setFixedForFilter}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue placeholder="All purposes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Purposes</SelectItem>
            {DEFAULT_FIXED_FOR.map(f => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="secondary" size="sm" onClick={applyFilters}>Apply</Button>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setColorManagerOpen(true)}>
            <Settings2 size={14} className="mr-1" />
            Color Codes
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer size={14} className="mr-1" />
            Print Day Board
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
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
        <div className="flex flex-wrap gap-3">
          {colorCodes.map(cc => (
            <div key={cc.id} className="flex items-center gap-1.5 text-xs text-slate-600">
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
```

---

## Step 3: Day Popover (`components/calendar/DayPopover.tsx`)

```typescript
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
          <div className="flex items-center justify-between">
            <SheetTitle>
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

        <div className="mt-4 space-y-3">
          {events.map(event => (
            <Link
              key={event.id}
              href={`/cases/${event.id}`}
              className="block p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />
                    <span className="font-mono text-sm text-slate-700">
                      {event.resource.caseNumber ?? '—'}
                    </span>
                    {event.resource.fixedFor && (
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">
                        {event.resource.fixedFor}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-900 mt-1">
                    {event.resource.firstParty} <span className="text-slate-400">vs</span> {event.resource.oppositeParty}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{event.resource.courtName}</p>
                </div>
                <ArrowRight size={14} className="text-slate-400 mt-1 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

---

## Step 4: Color Code Manager (`components/calendar/ColorCodeManager.tsx`)

```typescript
'use client'
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { DEFAULT_FIXED_FOR } from '@/lib/constants'

interface ColorCode {
  id: string
  label: string
  color: string
}

interface ColorCodeManagerProps {
  open: boolean
  onClose: () => void
  profileId: string
  existingCodes: ColorCode[]
}

export function ColorCodeManager({ open, onClose, existingCodes }: ColorCodeManagerProps) {
  const router = useRouter()
  const [codes, setCodes] = useState(existingCodes)
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState('#4F46E5')
  const [saving, setSaving] = useState(false)

  const addCode = async () => {
    if (!newLabel) return
    setSaving(true)
    try {
      const res = await fetch('/api/color-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel, color: newColor }),
      })
      const newCode = await res.json()
      setCodes(prev => [...prev, newCode])
      setNewLabel('')
      setNewColor('#4F46E5')
      router.refresh()
    } catch {
      toast.error('Failed to add color code')
    } finally {
      setSaving(false)
    }
  }

  const deleteCode = async (id: string) => {
    await fetch(`/api/color-codes/${id}`, { method: 'DELETE' })
    setCodes(prev => prev.filter(c => c.id !== id))
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Calendar Color Codes</SheetTitle>
        </SheetHeader>
        <p className="text-sm text-slate-500 mt-1">
          Assign colors to "Fixed For" labels for the calendar.
        </p>

        <div className="py-6 space-y-4">
          {/* Existing codes */}
          {codes.map(code => (
            <div key={code.id} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: code.color }} />
              <span className="text-sm flex-1">{code.label}</span>
              <button onClick={() => deleteCode(code.id)} className="text-slate-400 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* Add new code */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div>
              <Label>Label (Fixed For value)</Label>
              <Input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. For Arguments"
                list="fixed-for-options"
              />
              <datalist id="fixed-for-options">
                {DEFAULT_FIXED_FOR.map(f => <option key={f} value={f} />)}
              </datalist>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-slate-200"
                />
                <Input
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  className="font-mono w-32"
                />
              </div>
            </div>
            <Button onClick={addCode} disabled={saving || !newLabel} size="sm">
              <Plus size={14} className="mr-1" />
              Add Color Code
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

---

## API Routes

### `app/api/color-codes/route.ts`
```typescript
// POST: create color code
// GET: list color codes for current user
// Body: { label: string, color: string }
// Upsert: if label already exists, update the color
```

### `app/api/color-codes/[id]/route.ts`
```typescript
// DELETE: delete color code by id
// Verify: colorCode.profileId === userId
```

---

## Custom CSS for react-big-calendar

Add to `globals.css`:

```css
/* Override react-big-calendar default styles */
.rbc-calendar {
  font-family: var(--font-sans);
}
.rbc-header {
  @apply text-xs font-medium text-slate-500 uppercase py-2;
}
.rbc-today {
  @apply bg-indigo-50;
}
.rbc-day-bg:hover {
  @apply bg-slate-50;
}
.rbc-event {
  @apply text-xs;
}
.rbc-show-more {
  @apply text-xs text-indigo-600;
}
```

---

## Verification Checklist
- [ ] Calendar renders with correct month/year
- [ ] Cases appear as colored chips on their next date
- [ ] Chip color matches the "Fixed For" color code
- [ ] Clicking a day opens DayPopover with all cases for that day
- [ ] Clicking a case chip navigates to case detail
- [ ] Month/Week/Day view toggle works
- [ ] Navigation (prev/next) loads new month's data
- [ ] Color code manager opens and saves new codes
- [ ] Deleting a color code removes it and updates calendar
- [ ] Print Day Board opens correct API endpoint
- [ ] Court type and Fixed For filters work correctly
- [ ] Color legend shows below calendar
