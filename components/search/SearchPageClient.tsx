'use client'
import { useState } from 'react'
import { Search, Filter, Download, Mail, X, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { CaseCard } from '@/components/cases/CaseCard'
import { CaseTable } from '@/components/cases/CaseTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { toast } from 'sonner'
import { COURT_TYPES, DEFAULT_FIXED_FOR } from '@/lib/constants'

interface SearchFilters {
  q: string; caseNumber: string; cnrNumber: string; courtType: string
  firstParty: string; oppositeParty: string; fixedFor: string
  nextDateFrom: string; nextDateTo: string; year: string
  includeDecided: boolean; onlyDecided: boolean; onlyAwaited: boolean; summaryView: boolean
}

const DEFAULT_FILTERS: SearchFilters = {
  q: '', caseNumber: '', cnrNumber: '', courtType: '', firstParty: '',
  oppositeParty: '', fixedFor: '', nextDateFrom: '', nextDateTo: '', year: '',
  includeDecided: false, onlyDecided: false, onlyAwaited: false, summaryView: false,
}

export function SearchPageClient({ profileId }: { profileId: string }) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  const updateFilter = (key: keyof SearchFilters, value: any) => setFilters(prev => ({ ...prev, [key]: value }))

  const buildParams = () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== false) params.set(key, String(value))
    })
    return params
  }

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true); setHasSearched(true)
    try {
      const res = await fetch(`/api/search/cases?${buildParams().toString()}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults(data.cases); setTotalCount(data.total)
    } catch { toast.error('Search failed') }
    finally { setLoading(false) }
  }

  const handleExport = (format: 'pdf' | 'excel') => {
    const params = buildParams()
    window.open(format === 'pdf' ? `/api/export/cases-pdf?${params}` : `/api/export/cases-excel?${params}`, '_blank')
  }

  const handleNotifyClients = async () => {
    if (results.length === 0) return
    if (!confirm(`Send hearing notifications to clients for ${results.length} cases?`)) return
    try {
      const res = await fetch('/api/notify/clients-bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseIds: results.map(c => c.id) }),
      })
      const data = await res.json()
      toast.success(`Notifications sent to ${data.sent} clients`)
    } catch { toast.error('Failed to send notifications') }
  }

  const resetFilters = () => { setFilters(DEFAULT_FILTERS); setResults([]); setHasSearched(false) }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-foreground">Search / Report</h1>

      <form onSubmit={handleSearch}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={filters.q} onChange={e => updateFilter('q', e.target.value)}
              placeholder="Search by party name, case number, CNR number..."
              className="pl-9 h-10 text-sm" />
          </div>
          <Button type="submit" disabled={loading} className="h-10 px-5">
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Case No.</Label>
          <Input placeholder="e.g. CS/123/2024" value={filters.caseNumber}
            onChange={e => updateFilter('caseNumber', e.target.value)} className="w-40 h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Court Type</Label>
          <Select value={filters.courtType || '_all'} onValueChange={v => updateFilter('courtType', v === '_all' ? '' : v)}>
            <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="All Courts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Courts</SelectItem>
              {COURT_TYPES.map(ct => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Next Date From</Label>
          <Input type="date" value={filters.nextDateFrom} onChange={e => updateFilter('nextDateFrom', e.target.value)} className="w-36 h-8 text-sm" />
        </div>
        <div className="flex items-end pb-1.5">
          <span className="text-muted-foreground text-sm">to</span>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Next Date To</Label>
          <Input type="date" value={filters.nextDateTo} onChange={e => updateFilter('nextDateTo', e.target.value)} className="w-36 h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Fixed For</Label>
          <Select value={filters.fixedFor || '_all'} onValueChange={v => updateFilter('fixedFor', v === '_all' ? '' : v)}>
            <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="Any Purpose" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Any Purpose</SelectItem>
              {DEFAULT_FIXED_FOR.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2 pb-0.5">
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1"
            onClick={() => setShowAdvanced(!showAdvanced)}>
            <Filter size={12} />
            {showAdvanced ? 'Less' : 'More'} Filters
          </Button>
          {hasSearched && (
            <Button type="button" variant="ghost" size="sm" className="h-8" onClick={resetFilters}>
              <X size={12} className="mr-1" /> Reset
            </Button>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="bg-secondary/50 rounded-xl border border-border p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs mb-1 block text-muted-foreground">CNR Number</Label>
            <Input value={filters.cnrNumber} onChange={e => updateFilter('cnrNumber', e.target.value)} className="h-8 text-sm font-mono" placeholder="DLHC01-0001-2024" />
          </div>
          <div>
            <Label className="text-xs mb-1 block text-muted-foreground">First Party</Label>
            <Input value={filters.firstParty} onChange={e => updateFilter('firstParty', e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs mb-1 block text-muted-foreground">Opposite Party</Label>
            <Input value={filters.oppositeParty} onChange={e => updateFilter('oppositeParty', e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs mb-1 block text-muted-foreground">Year</Label>
            <Input value={filters.year} onChange={e => updateFilter('year', e.target.value)} className="h-8 text-sm" placeholder="e.g. 2024" />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-5 text-sm">
        {[
          { key: 'includeDecided', label: 'Include Decided' },
          { key: 'onlyDecided', label: 'Only Decided' },
          { key: 'onlyAwaited', label: 'Only Awaited' },
          { key: 'summaryView', label: 'Summary View (Table)' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox checked={filters[key as keyof SearchFilters] as boolean}
              onCheckedChange={v => updateFilter(key as keyof SearchFilters, v)} />
            <span className="text-foreground">{label}</span>
          </label>
        ))}
      </div>

      {hasSearched && results.length > 0 && (
        <div className="flex items-center gap-3 py-3 border-y border-border">
          <span className="text-sm text-foreground font-medium">
            {totalCount} result{totalCount !== 1 ? 's' : ''} found
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8" onClick={() => handleExport('pdf')}>
              <Download size={12} className="mr-1.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => handleExport('excel')}>
              <Download size={12} className="mr-1.5" /> Excel
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={handleNotifyClients}>
              <Mail size={12} className="mr-1.5" /> Notify Clients
            </Button>
          </div>
        </div>
      )}

      {!hasSearched ? (
        <div className="py-16 text-center">
          <Search size={36} className="text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Enter a search term or apply filters to find cases</p>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState icon={Briefcase} title="No cases found" description="Try adjusting your search terms or filters." />
      ) : filters.summaryView ? (
        <CaseTable cases={results} />
      ) : (
        <div className="space-y-2">
          {results.map(c => <CaseCard key={c.id} case={c} />)}
        </div>
      )}
    </div>
  )
}
