'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { RefreshCw, Search, Download, Scale, Building2 } from 'lucide-react'

interface State { state_id: string; state_code: string; state_name: string }
interface District { id: string; name: string }
interface Complex { id: string; name: string; establishment: string }
interface CauseListEntry {
  serialNo: string; caseNumber: string; petitioner: string
  respondent: string; advocate: string; purpose: string; courtNo: string
}

export function CauseListPageClient() {
  const [states, setStates] = useState<State[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [complexes, setComplexes] = useState<Complex[]>([])
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedComplex, setSelectedComplex] = useState('')
  const [selectedEstablishment, setSelectedEstablishment] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [caseType, setCaseType] = useState('')
  const [causeList, setCauseList] = useState<CauseListEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    fetch('/api/courts/states').then(r => r.json()).then(data => setStates(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedState) { setDistricts([]); setSelectedDistrict(''); return }
    fetch(`/api/courts/districts?state_code=${selectedState}`).then(r => r.json())
      .then(data => setDistricts(Array.isArray(data) ? data : [])).catch(() => setDistricts([]))
    setSelectedDistrict(''); setComplexes([]); setSelectedComplex('')
  }, [selectedState])

  useEffect(() => {
    if (!selectedState || !selectedDistrict) { setComplexes([]); setSelectedComplex(''); return }
    fetch(`/api/courts/complexes?state_code=${selectedState}&district_code=${selectedDistrict}`)
      .then(r => r.json()).then(data => setComplexes(Array.isArray(data) ? data : [])).catch(() => setComplexes([]))
    setSelectedComplex('')
  }, [selectedState, selectedDistrict])

  async function handleSearch() {
    if (!selectedState || !selectedDistrict) { toast.error('Please select state and district'); return }
    setLoading(true); setSearched(true)
    try {
      const complex = complexes.find(c => c.id === selectedComplex)
      const params = new URLSearchParams({
        state: selectedState, district: selectedDistrict, complex: selectedComplex,
        establishment: complex?.establishment ?? selectedEstablishment, date,
        ...(caseType && { case_type: caseType }),
      })
      const res = await fetch(`/api/courts/causelist?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCauseList(data.causeList ?? [])
      if ((data.causeList ?? []).length === 0) toast.info('No cause list entries found for this date')
    } catch (error: any) {
      toast.error(error.message ?? 'Failed to fetch cause list'); setCauseList([])
    } finally { setLoading(false) }
  }

  const stateName = states.find(s => s.state_code === selectedState)?.state_name ?? ''
  const districtName = districts.find(d => d.id === selectedDistrict)?.name ?? ''

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Scale size={18} className="text-muted-foreground" />
            Cause List
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Browse daily cause lists from eCourts</p>
        </div>
        {causeList.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download size={14} className="mr-1.5" /> Print
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>State <span className="text-destructive">*</span></Label>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>
                {states.map(s => <SelectItem key={s.state_id} value={s.state_code}>{s.state_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>District <span className="text-destructive">*</span></Label>
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={districts.length === 0}>
              <SelectTrigger><SelectValue placeholder={selectedState ? 'Select district' : 'Select state first'} /></SelectTrigger>
              <SelectContent>
                {districts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Court Complex</Label>
            <Select value={selectedComplex} onValueChange={setSelectedComplex} disabled={complexes.length === 0}>
              <SelectTrigger><SelectValue placeholder={selectedDistrict ? 'Select complex (optional)' : 'Select district first'} /></SelectTrigger>
              <SelectContent>
                {complexes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Case Type (optional)</Label>
            <Input placeholder="e.g. CCC, CS" value={caseType} onChange={e => setCaseType(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} disabled={loading} className="w-full">
              {loading ? <RefreshCw size={14} className="animate-spin mr-1.5" /> : <Search size={14} className="mr-1.5" />}
              {loading ? 'Loading...' : 'Get Cause List'}
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <Building2 size={15} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {stateName && districtName ? `${districtName}, ${stateName}` : 'Results'}
              </span>
              {date && (
                <span className="text-sm text-muted-foreground">
                  — {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
            <Badge variant="secondary">{causeList.length} entries</Badge>
          </div>

          {causeList.length === 0 ? (
            <div className="py-16 text-center">
              <Scale size={36} className="mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground text-sm">No cause list entries found</p>
              <p className="text-muted-foreground/60 text-xs mt-1">The court may not have uploaded the list yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border">
                    {['#', 'Case No.', 'Petitioner', 'Respondent', 'Advocate', 'Purpose', 'Court No.'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {causeList.map((entry, i) => (
                    <tr key={i} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground text-xs">{entry.serialNo || i + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">{entry.caseNumber || '—'}</td>
                      <td className="px-4 py-3 text-foreground max-w-[180px] truncate">{entry.petitioner || '—'}</td>
                      <td className="px-4 py-3 text-foreground max-w-[180px] truncate">{entry.respondent || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{entry.advocate || '—'}</td>
                      <td className="px-4 py-3">
                        {entry.purpose ? <Badge variant="secondary" className="text-xs font-normal">{entry.purpose}</Badge> : '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground text-xs font-medium">{entry.courtNo || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
