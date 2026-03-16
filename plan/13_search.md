# Stage 13: Search / Report Page

## Goal
Build `/search` — a dedicated search and reporting page with advanced filters, bulk export, and client notification actions.

---

## File: `app/(dashboard)/search/page.tsx`

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SearchPageClient } from '@/components/search/SearchPageClient'

export default async function SearchPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.userId
  return <SearchPageClient profileId={userId} />
}
```

---

## `components/search/SearchPageClient.tsx` (Client Component)

All searching is client-side with API calls — no server-side rendering here.

```typescript
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, Download, Mail, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { CaseCard } from '@/components/cases/CaseCard'
import { CaseTable } from '@/components/cases/CaseTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { toast } from 'sonner'
import { Briefcase } from 'lucide-react'
import { COURT_TYPES, DEFAULT_FIXED_FOR } from '@/lib/constants'

interface SearchFilters {
  q: string
  caseNumber: string
  cnrNumber: string
  courtType: string
  firstParty: string
  oppositeParty: string
  fixedFor: string
  nextDateFrom: string
  nextDateTo: string
  year: string
  includeDecided: boolean
  onlyDecided: boolean
  onlyAwaited: boolean
  summaryView: boolean
}

const DEFAULT_FILTERS: SearchFilters = {
  q: '',
  caseNumber: '',
  cnrNumber: '',
  courtType: '',
  firstParty: '',
  oppositeParty: '',
  fixedFor: '',
  nextDateFrom: '',
  nextDateTo: '',
  year: '',
  includeDecided: false,
  onlyDecided: false,
  onlyAwaited: false,
  summaryView: false,
}

export function SearchPageClient({ profileId }: { profileId: string }) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    setHasSearched(true)

    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== false) params.set(key, String(value))
      })

      const res = await fetch(`/api/search/cases?${params.toString()}`)
      const data = await res.json()
      setResults(data.cases)
      setTotalCount(data.total)
    } catch {
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'pdf' | 'excel') => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== false) params.set(key, String(value))
    })
    const url = format === 'pdf' ? `/api/export/cases-pdf?${params}` : `/api/export/cases-excel?${params}`
    window.open(url, '_blank')
  }

  const handleNotifyClients = async () => {
    if (results.length === 0) return
    const confirmed = window.confirm(`Send hearing notifications to clients for ${results.length} cases?`)
    if (!confirmed) return

    try {
      const res = await fetch('/api/notify/clients-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseIds: results.map(c => c.id) }),
      })
      const data = await res.json()
      toast.success(`Notifications sent to ${data.sent} clients`)
    } catch {
      toast.error('Failed to send notifications')
    }
  }

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setResults([])
    setHasSearched(false)
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-slate-900">Search / Report</h1>

      {/* Main search bar */}
      <form onSubmit={handleSearch}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={filters.q}
              onChange={e => updateFilter('q', e.target.value)}
              placeholder="Search by party name, case number, CNR number…"
              className="pl-9 h-11 text-base"
            />
          </div>
          <Button type="submit" disabled={loading} className="h-11">
            {loading ? 'Searching…' : 'Search'}
          </Button>
        </div>
      </form>

      {/* Quick filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Case Number */}
        <Input
          placeholder="Case No."
          value={filters.caseNumber}
          onChange={e => updateFilter('caseNumber', e.target.value)}
          className="w-36 h-9 text-sm"
        />

        {/* Court Type */}
        <Select value={filters.courtType} onValueChange={v => updateFilter('courtType', v)}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Court Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Courts</SelectItem>
            {COURT_TYPES.map(ct => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Date range */}
        <Input type="date" value={filters.nextDateFrom} onChange={e => updateFilter('nextDateFrom', e.target.value)} className="w-36 h-9 text-sm" />
        <span className="text-slate-400 text-sm">to</span>
        <Input type="date" value={filters.nextDateTo} onChange={e => updateFilter('nextDateTo', e.target.value)} className="w-36 h-9 text-sm" />

        {/* Fixed For */}
        <Select value={filters.fixedFor} onValueChange={v => updateFilter('fixedFor', v)}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Fixed For" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Purpose</SelectItem>
            {DEFAULT_FIXED_FOR.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* More filters toggle */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-1"
        >
          <Filter size={13} />
          {showAdvanced ? 'Less' : 'More'} Filters
        </Button>

        {/* Reset */}
        {hasSearched && (
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            <X size={13} className="mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs">CNR Number</Label>
            <Input value={filters.cnrNumber} onChange={e => updateFilter('cnrNumber', e.target.value)} className="h-9 text-sm font-mono mt-1" />
          </div>
          <div>
            <Label className="text-xs">First Party</Label>
            <Input value={filters.firstParty} onChange={e => updateFilter('firstParty', e.target.value)} className="h-9 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs">Opposite Party</Label>
            <Input value={filters.oppositeParty} onChange={e => updateFilter('oppositeParty', e.target.value)} className="h-9 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs">Year</Label>
            <Input value={filters.year} onChange={e => updateFilter('year', e.target.value)} className="h-9 text-sm mt-1" placeholder="e.g. 2024" />
          </div>
        </div>
      )}

      {/* Checkboxes row */}
      <div className="flex flex-wrap gap-5 text-sm">
        {[
          { key: 'includeDecided', label: 'Include Decided' },
          { key: 'onlyDecided',    label: 'Only Decided' },
          { key: 'onlyAwaited',    label: 'Only Awaited' },
          { key: 'summaryView',    label: 'Summary View' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={filters[key as keyof SearchFilters] as boolean}
              onCheckedChange={v => updateFilter(key as keyof SearchFilters, v)}
            />
            <span className="text-slate-700">{label}</span>
          </label>
        ))}
      </div>

      {/* Results actions bar */}
      {hasSearched && results.length > 0 && (
        <div className="flex items-center gap-3 py-3 border-y border-slate-200">
          <span className="text-sm text-slate-600">
            {totalCount} result{totalCount !== 1 ? 's' : ''} found
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <Download size={13} className="mr-1" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
              <Download size={13} className="mr-1" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleNotifyClients}>
              <Mail size={13} className="mr-1" />
              Notify Clients
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {!hasSearched ? (
        <div className="py-16 text-center">
          <Search size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Enter a search term or apply filters to find cases</p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No cases found"
          description="Try adjusting your search terms or filters."
        />
      ) : filters.summaryView ? (
        <CaseTable cases={results} />
      ) : (
        <div className="space-y-3">
          {results.map(c => <CaseCard key={c.id} case={c} />)}
        </div>
      )}
    </div>
  )
}
```

---

## API Route: `app/api/search/cases/route.ts`

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId

  const { searchParams } = new URL(request.url)

  const q = searchParams.get('q') ?? ''
  const caseNumber = searchParams.get('caseNumber') ?? ''
  const cnrNumber = searchParams.get('cnrNumber') ?? ''
  const courtType = searchParams.get('courtType') ?? ''
  const firstParty = searchParams.get('firstParty') ?? ''
  const oppositeParty = searchParams.get('oppositeParty') ?? ''
  const fixedFor = searchParams.get('fixedFor') ?? ''
  const nextDateFrom = searchParams.get('nextDateFrom') ?? ''
  const nextDateTo = searchParams.get('nextDateTo') ?? ''
  const year = searchParams.get('year') ?? ''
  const includeDecided = searchParams.get('includeDecided') === 'true'
  const onlyDecided = searchParams.get('onlyDecided') === 'true'
  const onlyAwaited = searchParams.get('onlyAwaited') === 'true'

  // Build status filter
  let statusFilter: any = onlyDecided
    ? 'decided'
    : includeDecided ? undefined : { in: ['running', 'abandoned'] }

  if (onlyAwaited) statusFilter = 'running'

  const where: any = {
    profileId: userId,
    ...(statusFilter && { status: statusFilter }),
    ...(onlyAwaited && { nextDate: null }),
    ...(courtType && { courtType }),
    ...(fixedFor && { fixedFor }),
    ...(year && { year: parseInt(year) }),
    ...(nextDateFrom && { nextDate: { gte: startOfDay(new Date(nextDateFrom)) } }),
    ...(nextDateTo && { nextDate: { lte: endOfDay(new Date(nextDateTo)) } }),
  }

  // Full text / specific field search
  const searchConditions: any[] = []
  if (q) {
    searchConditions.push(
      { caseNumber: { contains: q, mode: 'insensitive' } },
      { cnrNumber: { contains: q, mode: 'insensitive' } },
      { firstParty: { contains: q, mode: 'insensitive' } },
      { oppositeParty: { contains: q, mode: 'insensitive' } },
    )
  }
  if (caseNumber) searchConditions.push({ caseNumber: { contains: caseNumber, mode: 'insensitive' } })
  if (cnrNumber) searchConditions.push({ cnrNumber: { contains: cnrNumber, mode: 'insensitive' } })
  if (firstParty) searchConditions.push({ firstParty: { contains: firstParty, mode: 'insensitive' } })
  if (oppositeParty) searchConditions.push({ oppositeParty: { contains: oppositeParty, mode: 'insensitive' } })

  if (searchConditions.length > 0) {
    where.OR = searchConditions
  }

  const [cases, total] = await Promise.all([
    prisma.case.findMany({
      where,
      select: {
        id: true, caseNumber: true, cnrNumber: true,
        firstParty: true, oppositeParty: true,
        courtName: true, courtType: true,
        nextDate: true, fixedFor: true,
        status: true, isImportant: true,
        caseType: true, year: true,
      },
      orderBy: [{ nextDate: 'asc' }, { firstParty: 'asc' }],
      take: 100,
    }),
    prisma.case.count({ where })
  ])

  return NextResponse.json({ cases, total })
}
```

---

## API Route: `app/api/notify/clients-bulk/route.ts`

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { formatDate } from '@/lib/utils'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId

  const { caseIds } = await request.json()

  // Get cases with their clients' emails
  const cases = await prisma.case.findMany({
    where: { id: { in: caseIds }, profileId: userId },
    include: {
      clients: {
        include: {
          client: { select: { email: true, fullName: true } }
        }
      }
    }
  })

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { fullName: true, officeName: true, mobile: true }
  })

  let sent = 0
  for (const c of cases) {
    for (const cc of c.clients) {
      if (!cc.client.email) continue

      await resend.emails.send({
        from: 'notifications@advocase.app',
        to: cc.client.email,
        subject: `Hearing Notice: ${c.caseNumber}`,
        html: `
          <p>Dear ${cc.client.fullName},</p>
          <p>Your case <strong>${c.caseNumber}</strong> is scheduled for hearing on <strong>${formatDate(c.nextDate)}</strong> (${c.fixedFor ?? ''}) at ${c.courtName}.</p>
          <p>Please be present or provide instructions to your advocate.</p>
          <p>Regards,<br/>${profile?.fullName ?? 'Your Advocate'}<br/>${profile?.officeName ?? ''}<br/>${profile?.mobile ?? ''}</p>
        `,
      })
      sent++
    }
  }

  return NextResponse.json({ sent })
}
```

---

## Verification Checklist
- [ ] Basic search (q) finds cases by party name, case number, CNR
- [ ] Quick filter bar updates correctly
- [ ] Advanced filter panel toggles open/close
- [ ] All filters work in combination
- [ ] "Include Decided" shows decided cases in results
- [ ] "Only Decided" shows only decided cases
- [ ] "Only Awaited" shows cases with no next date
- [ ] "Summary View" switches to table view
- [ ] Results count shown in action bar
- [ ] Export PDF/Excel triggers correct API endpoint
- [ ] Notify Clients sends emails via Resend for all result cases
- [ ] Empty state shows when no results
- [ ] Reset button clears all filters and results
