'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Filter, List, Table2, Search, Briefcase } from 'lucide-react'
import { CaseCard } from './CaseCard'
import { CaseTable } from './CaseTable'
import { CaseFilters } from './CaseFilters'
import { ExportButton } from '@/components/shared/ExportButton'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface CaseItem {
  id: string
  caseNumber: string | null
  cnrNumber: string | null
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
  createdAt: Date
}

interface SearchParamsType {
  filter?: string
  date?: string
  search?: string
  courtType?: string
  fixedFor?: string
  page?: string
  view?: string
  [key: string]: string | undefined
}

interface CasesPageClientProps {
  cases: CaseItem[]
  total: number
  totalPages: number
  currentPage: number
  searchParams: SearchParamsType
}

const TABS = [
  { label: 'All', value: undefined },
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'Awaited', value: 'awaited' },
  { label: 'Decided', value: 'decided' },
  { label: 'Abandoned', value: 'abandoned' },
  { label: 'Important', value: 'important' },
]

export function CasesPageClient({ cases, total, totalPages, currentPage, searchParams }: CasesPageClientProps) {
  const router = useRouter()
  const [view, setView] = useState<'list' | 'table'>((searchParams.view as 'list' | 'table') ?? 'list')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(searchParams.search ?? '')
  const [isPending, startTransition] = useTransition()

  const activeFilter = searchParams.filter

  const navigateWithParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, value)
    })
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) params.delete(key)
      else params.set(key, value)
    })
    params.delete('page')
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
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Cases</h1>
          <p className="text-sm text-muted-foreground">{total} total cases</p>
        </div>
        <Button asChild size="sm">
          <Link href="/cases/new">
            <Plus size={14} className="mr-1.5" />
            Add Case
          </Link>
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0.5 overflow-x-auto border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              'px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeFilter === tab.value
                ? 'text-foreground border-foreground'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, case no., CNR..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-8" disabled={isPending}>
            Search
          </Button>
        </form>

        <Button variant="outline" size="sm" className="h-8" onClick={() => setFiltersOpen(true)}>
          <Filter size={13} className="mr-1.5" />
          Filters
        </Button>

        <ExportButton type="cases" filters={searchParams} />

        <div className="hidden md:flex border border-border rounded-md overflow-hidden">
          <button
            onClick={() => setView('list')}
            className={cn('p-1.5 transition-colors', view === 'list' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50')}
            title="List view"
          >
            <List size={15} />
          </button>
          <button
            onClick={() => setView('table')}
            className={cn('p-1.5 transition-colors border-l border-border', view === 'table' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50')}
            title="Table view"
          >
            <Table2 size={15} />
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
        <div className="space-y-2">
          {cases.map((c) => <CaseCard key={c.id} case={c} />)}
        </div>
      ) : (
        <CaseTable cases={cases} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => navigateWithParams({ page: String(currentPage - 1) })}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
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
