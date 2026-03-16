# Stage 6: Cases List Page

## Goal
Build `/cases` — tab-filtered list with card view (default), table view (desktop), search, filter slide-over, pagination, and export.

---

## Files to Create
- `app/(dashboard)/cases/page.tsx`
- `components/cases/CaseCard.tsx`
- `components/cases/CaseTable.tsx`
- `components/cases/CaseStatusBadge.tsx`
- `components/cases/CaseFilters.tsx` (slide-over)

---

## Step 1: Page (`app/(dashboard)/cases/page.tsx`)

This is a **Server Component** that reads search params to determine filters.

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { startOfDay, endOfDay, addDays } from 'date-fns'
import { CasesPageClient } from '@/components/cases/CasesPageClient'

interface CasesPageProps {
  searchParams: {
    filter?: string      // today | tomorrow | awaited | decided | abandoned | important
    date?: string        // YYYY-MM-DD — from 7-day strip click
    search?: string
    courtType?: string
    fixedFor?: string
    page?: string
    view?: string        // list | table
  }
}

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.userId

  const profileId = userId
  const page = Number(searchParams.page ?? 1)
  const limit = 25
  const skip = (page - 1) * limit

  // Build Prisma where clause from filter
  const where = buildWhereClause(profileId, searchParams)

  const [cases, total] = await Promise.all([
    prisma.case.findMany({
      where,
      select: {
        id: true,
        caseNumber: true,
        cnrNumber: true,
        firstParty: true,
        oppositeParty: true,
        courtName: true,
        courtType: true,
        nextDate: true,
        fixedFor: true,
        status: true,
        isImportant: true,
        caseType: true,
        year: true,
        createdAt: true,
      },
      orderBy: [{ nextDate: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.case.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <CasesPageClient
      cases={cases}
      total={total}
      totalPages={totalPages}
      currentPage={page}
      searchParams={searchParams}
    />
  )
}

function buildWhereClause(profileId: string, params: CasesPageProps['searchParams']) {
  const today = new Date()
  const tomorrow = addDays(today, 1)

  const base = { profileId }

  // Tab filters
  if (params.filter === 'today') {
    return { ...base, nextDate: { gte: startOfDay(today), lte: endOfDay(today) } }
  }
  if (params.filter === 'tomorrow') {
    return { ...base, nextDate: { gte: startOfDay(tomorrow), lte: endOfDay(tomorrow) } }
  }
  if (params.filter === 'awaited') {
    return { ...base, nextDate: null, status: 'running' }
  }
  if (params.filter === 'decided') {
    return { ...base, status: 'decided' }
  }
  if (params.filter === 'abandoned') {
    return { ...base, status: 'abandoned' }
  }
  if (params.filter === 'important') {
    return { ...base, isImportant: true }
  }

  // Date from 7-day strip
  if (params.date) {
    const day = new Date(params.date)
    return { ...base, nextDate: { gte: startOfDay(day), lte: endOfDay(day) } }
  }

  // Search + additional filters
  return {
    ...base,
    ...(params.search && {
      OR: [
        { caseNumber: { contains: params.search, mode: 'insensitive' as const } },
        { cnrNumber: { contains: params.search, mode: 'insensitive' as const } },
        { firstParty: { contains: params.search, mode: 'insensitive' as const } },
        { oppositeParty: { contains: params.search, mode: 'insensitive' as const } },
      ]
    }),
    ...(params.courtType && { courtType: params.courtType }),
    ...(params.fixedFor && { fixedFor: params.fixedFor }),
  }
}
```

---

## Step 2: Client Container (`components/cases/CasesPageClient.tsx`)

```typescript
'use client'
import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Filter, Download, List, Table2, Search } from 'lucide-react'
import { CaseCard } from './CaseCard'
import { CaseTable } from './CaseTable'
import { CaseFilters } from './CaseFilters'
import { ExportButton } from '@/components/shared/ExportButton'
import { EmptyState } from '@/components/shared/EmptyState'
import Link from 'next/link'
import { Briefcase } from 'lucide-react'

const TABS = [
  { label: 'All', value: undefined },
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'Awaited', value: 'awaited' },
  { label: 'Decided', value: 'decided' },
  { label: 'Abandoned', value: 'abandoned' },
  { label: 'Important', value: 'important' },
]

export function CasesPageClient({ cases, total, totalPages, currentPage, searchParams }) {
  const router = useRouter()
  const [view, setView] = useState<'list' | 'table'>(searchParams.view ?? 'list')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(searchParams.search ?? '')
  const [isPending, startTransition] = useTransition()

  const activeFilter = searchParams.filter

  const navigateWithParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams as Record<string, string>)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) params.delete(key)
      else params.set(key, value)
    })
    params.delete('page') // reset pagination on filter change
    router.push(`/cases?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => navigateWithParams({ search: searchValue || undefined }))
  }

  const handleTabChange = (value: string | undefined) => {
    navigateWithParams({ filter: value, search: undefined })
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Cases</h1>
          <p className="text-sm text-slate-500">{total} total cases</p>
        </div>
        <Button asChild>
          <Link href="/cases/new">
            <Plus size={16} className="mr-2" />
            Add Case
          </Link>
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md whitespace-nowrap transition-colors ${
              activeFilter === tab.value
                ? 'text-indigo-700 border-b-2 border-indigo-600 -mb-px bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name, case no., CNR…"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
            Search
          </Button>
        </form>

        {/* Filter button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen(true)}
          className="gap-1"
        >
          <Filter size={14} />
          Filters
        </Button>

        {/* Export dropdown */}
        <ExportButton type="cases" filters={searchParams} />

        {/* View toggle */}
        <div className="hidden md:flex border rounded-md">
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-l-md ${view === 'list' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setView('table')}
            className={`p-2 rounded-r-md ${view === 'table' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
          >
            <Table2 size={16} />
          </button>
        </div>
      </div>

      {/* Case list/table */}
      {cases.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No cases found"
          description={activeFilter ? `No ${activeFilter} cases.` : 'Add your first case to get started.'}
          action={{ label: 'Add Case', href: '/cases/new' }}
        />
      ) : view === 'list' ? (
        <div className="space-y-3">
          {cases.map((c) => <CaseCard key={c.id} case={c} />)}
        </div>
      ) : (
        <CaseTable cases={cases} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => navigateWithParams({ page: String(currentPage - 1) })}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => navigateWithParams({ page: String(currentPage + 1) })}
          >
            Next
          </Button>
        </div>
      )}

      {/* Filters slide-over */}
      <CaseFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={(filters) => {
          navigateWithParams(filters)
          setFiltersOpen(false)
        }}
        initialValues={searchParams}
      />
    </div>
  )
}
```

---

## Step 3: Case Card (`components/cases/CaseCard.tsx`)

```typescript
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
        <div className="flex items-center gap-2 mb-2">
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
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
          {c.courtName && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {c.courtName}
            </span>
          )}
          {c.nextDate && (
            <span className={cn('font-medium', isOverdue ? 'text-red-600' : 'text-slate-600')}>
              📅 {dateLabel} ({formatDate(c.nextDate, 'dd MMM')})
            </span>
          )}
          {!c.nextDate && c.status === 'running' && (
            <span className="text-amber-600 font-medium">📅 Date Awaited</span>
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
```

---

## Step 4: Case Status Badge (`components/cases/CaseStatusBadge.tsx`)

```typescript
import { cn } from '@/lib/utils'

const statusConfig = {
  running:   { label: 'Running',   className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  decided:   { label: 'Decided',   className: 'bg-green-50 text-green-700 border border-green-200' },
  abandoned: { label: 'Abandoned', className: 'bg-slate-100 text-slate-600 border border-slate-200' },
}

interface CaseStatusBadgeProps {
  status: string
  className?: string
}

export function CaseStatusBadge({ status, className }: CaseStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.running
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', config.className, className)}>
      {config.label}
    </span>
  )
}
```

---

## Step 5: Case Table (`components/cases/CaseTable.tsx`)

```typescript
'use client'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender, ColumnDef, SortingState
} from '@tanstack/react-table'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { CaseStatusBadge } from './CaseStatusBadge'
import { formatDate } from '@/lib/utils'

type CaseRow = {
  id: string
  caseNumber: string | null
  cnrNumber: string | null
  firstParty: string | null
  oppositeParty: string | null
  courtName: string | null
  nextDate: Date | null
  fixedFor: string | null
  status: string
  caseType: string | null
}

export function CaseTable({ cases }: { cases: CaseRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns: ColumnDef<CaseRow>[] = [
    {
      accessorKey: 'caseNumber',
      header: 'Case No.',
      cell: ({ row }) => (
        <Link href={`/cases/${row.original.id}`} className="font-mono text-sm text-indigo-600 hover:underline">
          {row.original.caseNumber ?? '—'}
        </Link>
      ),
    },
    {
      accessorKey: 'firstParty',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1">
          First Party
          {column.getIsSorted() === 'asc' ? <ArrowUp size={12} /> :
           column.getIsSorted() === 'desc' ? <ArrowDown size={12} /> :
           <ArrowUpDown size={12} />}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.firstParty ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'oppositeParty',
      header: 'Opposite Party',
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">{row.original.oppositeParty ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'courtName',
      header: 'Court',
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 truncate max-w-32 block">{row.original.courtName ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'nextDate',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting()} className="flex items-center gap-1">
          Next Date
          {column.getIsSorted() === 'asc' ? <ArrowUp size={12} /> :
           column.getIsSorted() === 'desc' ? <ArrowDown size={12} /> :
           <ArrowUpDown size={12} />}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.nextDate ? formatDate(row.original.nextDate) : 'Awaited'}</span>
      ),
    },
    {
      accessorKey: 'fixedFor',
      header: 'Fixed For',
      cell: ({ row }) => (
        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">
          {row.original.fixedFor ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <CaseStatusBadge status={row.original.status} />,
    },
  ]

  const table = useReactTable({
    data: cases,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## Step 6: Case Filters Slide-Over (`components/cases/CaseFilters.tsx`)

```typescript
'use client'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { COURT_TYPES, DEFAULT_FIXED_FOR } from '@/lib/constants'

interface FilterValues {
  caseNumber: string
  cnrNumber: string
  courtType: string
  firstParty: string
  oppositeParty: string
  fixedFor: string
  nextDateFrom: string
  nextDateTo: string
  year: string
}

interface CaseFiltersProps {
  open: boolean
  onClose: () => void
  onApply: (filters: Record<string, string>) => void
  initialValues: Record<string, string>
}

export function CaseFilters({ open, onClose, onApply, initialValues }: CaseFiltersProps) {
  const { register, control, handleSubmit, reset } = useForm<FilterValues>({
    defaultValues: initialValues,
  })

  const onSubmit = (values: FilterValues) => {
    const filters: Record<string, string> = {}
    Object.entries(values).forEach(([key, value]) => {
      if (value) filters[key] = value
    })
    onApply(filters)
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Cases</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Case Number</Label>
              <Input placeholder="e.g. CRL.P 1234" {...register('caseNumber')} />
            </div>
            <div className="space-y-1">
              <Label>CNR Number</Label>
              <Input placeholder="e.g. TGHC01..." {...register('cnrNumber')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Year</Label>
              <Input placeholder="e.g. 2024" {...register('year')} />
            </div>
            <div className="space-y-1">
              <Label>Court Type</Label>
              <Controller
                control={control}
                name="courtType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="All courts" /></SelectTrigger>
                    <SelectContent>
                      {COURT_TYPES.map(ct => (
                        <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>First Party</Label>
            <Input placeholder="Search by first party name" {...register('firstParty')} />
          </div>

          <div className="space-y-1">
            <Label>Opposite Party</Label>
            <Input placeholder="Search by opposite party name" {...register('oppositeParty')} />
          </div>

          <div className="space-y-1">
            <Label>Fixed For</Label>
            <Controller
              control={control}
              name="fixedFor"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Any purpose" /></SelectTrigger>
                  <SelectContent>
                    {DEFAULT_FIXED_FOR.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Next Date From</Label>
              <Input type="date" {...register('nextDateFrom')} />
            </div>
            <div className="space-y-1">
              <Label>Next Date To</Label>
              <Input type="date" {...register('nextDateTo')} />
            </div>
          </div>
        </form>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => { reset(); onApply({}) }}>
            Reset Filters
          </Button>
          <Button onClick={handleSubmit(onSubmit)}>
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
```

---

## Step 7: Export Button (`components/shared/ExportButton.tsx`)

```typescript
'use client'
import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface ExportButtonProps {
  type: 'cases'
  filters: Record<string, string>
}

export function ExportButton({ type, filters }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const exportAs = async (format: 'pdf' | 'excel') => {
    setLoading(true)
    try {
      const params = new URLSearchParams(filters).toString()
      const url = format === 'pdf'
        ? `/api/export/cases-pdf?${params}`
        : `/api/export/cases-excel?${params}`
      window.open(url, '_blank')
    } catch {
      toast.error('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1" disabled={loading}>
          <Download size={14} />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportAs('pdf')}>Export as PDF</DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAs('excel')}>Export as Excel</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## Verification Checklist
- [ ] Tab switching correctly filters cases (today/tomorrow/awaited/etc.)
- [ ] Search works across case number, CNR, first party, opposite party
- [ ] Filter slide-over applies all filters correctly
- [ ] List view shows CaseCard with all fields
- [ ] Table view shows sortable TanStack Table
- [ ] Pagination works (previous/next, page counter)
- [ ] Export buttons open correct API endpoints
- [ ] Empty state shows when no cases match filters
- [ ] Mobile: only list view (table view hidden on mobile)
- [ ] "Add Case" button navigates to `/cases/new`
