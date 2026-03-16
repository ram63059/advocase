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
    // Carry over existing params
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, value)
    })
    // Apply updates
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
      <div className="flex items-center gap-3 flex-wrap">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2 min-w-0">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name, case no., CNR..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
            Search
          </Button>
        </form>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen(true)}
          className="gap-1"
        >
          <Filter size={14} />
          Filters
        </Button>

        <ExportButton type="cases" filters={searchParams} />

        <div className="hidden md:flex border border-slate-200 rounded-md">
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-l-md transition-colors ${view === 'list' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
            title="List view"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setView('table')}
            className={`p-2 rounded-r-md transition-colors ${view === 'table' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
            title="Table view"
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
