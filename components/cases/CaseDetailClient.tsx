'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Pencil, RefreshCw, Star,
  CalendarDays, FileText, Receipt, Users, Link2, Bell, Gavel, MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CaseStatusBadge } from './CaseStatusBadge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Case, CaseHistory, CaseOrder, CaseNote, CaseDocument, CaseClient, Client, Fee, OpposeCounsel, Reminder, LinkedCase } from '@prisma/client'

type CaseDataType = Case & {
  history: CaseHistory[]
  orders: CaseOrder[]
  notes: CaseNote[]
  documents: CaseDocument[]
  clients: (CaseClient & { client: Client })[]
  oppositeCouns: OpposeCounsel[]
  fees: Fee[]
  reminders: Reminder[]
  linkedFrom: (LinkedCase & { linkedCase: Pick<Case, 'id' | 'caseNumber' | 'firstParty' | 'oppositeParty' | 'status'> })[]
  linkedTo: (LinkedCase & { case: Pick<Case, 'id' | 'caseNumber' | 'firstParty' | 'oppositeParty' | 'status'> })[]
}

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: Gavel },
  { id: 'history', label: 'History', icon: CalendarDays },
  { id: 'orders', label: 'Orders', icon: FileText },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'notes', label: 'Notes', icon: MessageSquare },
  { id: 'fees', label: 'Fees', icon: Receipt },
  { id: 'counsel', label: 'Counsel', icon: Users },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'linked', label: 'Linked', icon: Link2 },
]

export function CaseDetailClient({ caseData, profileId }: { caseData: CaseDataType; profileId: string }) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')

  const handleSync = async () => {
    if (!caseData.cnrNumber) {
      toast.error('No CNR number — cannot sync with eCourts')
      return
    }
    setSyncing(true)
    try {
      const res = await fetch('/api/courts/fetch-by-cnr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnr: caseData.cnrNumber, caseId: caseData.id }),
      })
      if (!res.ok) throw new Error('Sync failed')
      toast.success('Case synced with eCourts')
      router.refresh()
    } catch {
      toast.error('Sync failed. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  const totalFees = caseData.fees
    .filter(f => !f.isExpense)
    .reduce((sum, f) => sum + Number(f.amount), 0)

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
          <Link href="/cases">
            <ArrowLeft size={15} className="mr-1" />
            Cases
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {caseData.cnrNumber && (
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              <RefreshCw size={13} className={cn('mr-1.5', syncing && 'animate-spin')} />
              Sync eCourts
            </Button>
          )}
          <Button asChild size="sm">
            <Link href={`/cases/${caseData.id}/edit`}>
              <Pencil size={13} className="mr-1.5" />
              Edit Case
            </Link>
          </Button>
        </div>
      </div>

      {/* Case title card */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {caseData.courtType && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase tracking-wide">
                  {caseData.courtType}
                </span>
              )}
              <span className="font-mono text-sm text-muted-foreground">
                {caseData.caseNumber ?? 'No Number'}
                {caseData.year ? ` / ${caseData.year}` : ''}
              </span>
              <CaseStatusBadge status={caseData.status} />
              {caseData.isImportant && (
                <Star size={14} className="text-foreground/50 fill-foreground/20" />
              )}
            </div>
            <h1 className="text-lg font-semibold text-foreground truncate">
              {caseData.firstParty ?? '—'}{' '}
              <span className="font-normal text-muted-foreground">vs</span>{' '}
              {caseData.oppositeParty ?? '—'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{caseData.courtName}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground mb-0.5">Next Hearing</div>
            <div className="font-semibold text-foreground">
              {caseData.nextDate ? formatDate(caseData.nextDate) : 'Date Awaited'}
            </div>
            {caseData.fixedFor && (
              <div className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full mt-1 inline-block">
                {caseData.fixedFor}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">{caseData.history.length}</p>
            <p className="text-xs text-muted-foreground">Hearings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">{caseData.documents.length}</p>
            <p className="text-xs text-muted-foreground">Documents</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">{caseData.notes.length}</p>
            <p className="text-xs text-muted-foreground">Notes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalFees)}</p>
            <p className="text-xs text-muted-foreground">Fees</p>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-0.5 overflow-x-auto border-b border-border">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeSection === section.id
                ? 'text-foreground border-foreground'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            <section.icon size={13} />
            {section.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className="min-h-96">
        {activeSection === 'overview' && <OverviewSection c={caseData} />}
        {activeSection === 'history' && <HistorySection history={caseData.history} />}
        {activeSection === 'orders' && <OrdersSection orders={caseData.orders} caseId={caseData.id} />}
        {activeSection === 'documents' && <DocumentsSection documents={caseData.documents} caseId={caseData.id} />}
        {activeSection === 'notes' && <NotesSection notes={caseData.notes} caseId={caseData.id} />}
        {activeSection === 'fees' && <FeesSection fees={caseData.fees} caseId={caseData.id} />}
        {activeSection === 'counsel' && (
          <CounselSection clients={caseData.clients} counsel={caseData.oppositeCouns} />
        )}
        {activeSection === 'reminders' && <RemindersSection reminders={caseData.reminders} caseId={caseData.id} />}
        {activeSection === 'linked' && (
          <LinkedSection linkedFrom={caseData.linkedFrom} linkedTo={caseData.linkedTo} />
        )}
      </div>
    </div>
  )
}

const inlineInputClass = 'w-full border border-border rounded-md px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring'
const inlineLabelClass = 'text-xs font-medium text-muted-foreground block mb-1'
const sectionCardClass = 'bg-card rounded-xl border border-border'
const sectionHeaderClass = 'flex items-center justify-between px-5 py-4 border-b border-border'
const dividerClass = 'divide-y divide-border'
const emptyTextClass = 'text-sm text-muted-foreground px-5 py-8 text-center'
const addFormClass = 'px-5 py-4 border-b border-border bg-secondary/30 space-y-3'

function OverviewSection({ c }: { c: CaseDataType }) {
  const fields = [
    { label: 'Court Type', value: c.courtType },
    { label: 'Court Name', value: c.courtName },
    { label: 'Court No.', value: c.courtNo },
    { label: 'State', value: c.state },
    { label: 'District', value: c.district },
    { label: 'Case Number', value: c.caseNumber },
    { label: 'CNR Number', value: c.cnrNumber },
    { label: 'Reference No.', value: c.referenceNo },
    { label: 'File No.', value: c.fileNo },
    { label: 'File Name', value: c.fileName },
    { label: 'Year', value: c.year?.toString() },
    { label: 'Case Type', value: c.caseType },
    { label: 'Under Section', value: c.underSection },
    { label: 'Police Station', value: c.policeStation },
    { label: 'FIR Number', value: c.firNumber },
    { label: 'Judge Name', value: c.judgeName },
    { label: 'Filing Date', value: c.filingDate ? formatDate(c.filingDate) : undefined },
    { label: 'Previous Date', value: c.previousDate ? formatDate(c.previousDate) : undefined },
    { label: 'Next Date', value: c.nextDate ? formatDate(c.nextDate) : undefined },
    { label: 'Fixed For', value: c.fixedFor },
    { label: 'Company', value: c.company },
    { label: 'Empanelment', value: c.empanelment },
  ]

  return (
    <div className="space-y-5">
      <div className={sectionCardClass + ' p-5'}>
        <h3 className="font-semibold text-foreground text-sm mb-4">Case Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {fields.map(({ label, value }) => value ? (
            <div key={label} className="flex gap-2">
              <span className="text-sm text-muted-foreground w-36 shrink-0">{label}</span>
              <span className="text-sm text-foreground font-medium">{value}</span>
            </div>
          ) : null)}
        </div>
      </div>

      {(c.briefFacts || c.relevantLaws || c.comments) && (
        <div className={sectionCardClass + ' p-5'}>
          <h3 className="font-semibold text-foreground text-sm mb-4">Notes & Background</h3>
          {c.briefFacts && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Brief Facts</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{c.briefFacts}</p>
            </div>
          )}
          {c.relevantLaws && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Relevant Laws</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{c.relevantLaws}</p>
            </div>
          )}
          {c.comments && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Comments</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{c.comments}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function HistorySection({ history }: { history: CaseHistory[] }) {
  return (
    <div className={sectionCardClass}>
      <div className={sectionHeaderClass}>
        <h3 className="font-semibold text-foreground text-sm">Hearing History ({history.length})</h3>
      </div>
      {history.length === 0 ? (
        <p className={emptyTextClass}>No hearing history available.</p>
      ) : (
        <div className={dividerClass}>
          {history.map((h) => (
            <div key={h.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {h.hearingDate ? formatDate(h.hearingDate) : '—'}
                </p>
                {h.purpose && <p className="text-xs text-muted-foreground">{h.purpose}</p>}
                {h.judge && <p className="text-xs text-muted-foreground/60">Judge: {h.judge}</p>}
              </div>
              {h.businessOnDate && (
                <p className="text-xs text-muted-foreground">
                  Business on {formatDate(h.businessOnDate)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OrdersSection({ orders, caseId }: { orders: CaseOrder[]; caseId: string }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ orderType: '', orderDate: '', description: '', orderUrl: '' })
  const router = useRouter()

  const handleAdd = async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Order added')
      setAdding(false)
      setForm({ orderType: '', orderDate: '', description: '', orderUrl: '' })
      router.refresh()
    } catch {
      toast.error('Failed to add order')
    }
  }

  return (
    <div className={sectionCardClass}>
      <div className={sectionHeaderClass}>
        <h3 className="font-semibold text-foreground text-sm">Orders ({orders.length})</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : 'Add Order'}
        </Button>
      </div>
      {adding && (
        <div className={addFormClass}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={inlineLabelClass}>Order Type</label>
              <input className={inlineInputClass} placeholder="Interim / Final"
                value={form.orderType} onChange={e => setForm({ ...form, orderType: e.target.value })} />
            </div>
            <div>
              <label className={inlineLabelClass}>Order Date</label>
              <input type="date" className={inlineInputClass}
                value={form.orderDate} onChange={e => setForm({ ...form, orderDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={inlineLabelClass}>Description</label>
            <textarea className={inlineInputClass + ' min-h-[60px]'}
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className={inlineLabelClass}>Order URL (optional)</label>
            <input className={inlineInputClass} placeholder="https://..."
              value={form.orderUrl} onChange={e => setForm({ ...form, orderUrl: e.target.value })} />
          </div>
          <Button size="sm" onClick={handleAdd}>Save Order</Button>
        </div>
      )}
      {orders.length === 0 ? (
        <p className={emptyTextClass}>No orders recorded.</p>
      ) : (
        <div className={dividerClass}>
          {orders.map((o) => (
            <div key={o.id} className="px-5 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full mr-2">{o.orderType ?? 'Order'}</span>
                  <span className="text-sm font-medium text-foreground">
                    {o.orderDate ? formatDate(o.orderDate) : '—'}
                  </span>
                </div>
                {o.orderUrl && (
                  <a href={o.orderUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-foreground hover:underline font-medium">
                    View Order
                  </a>
                )}
              </div>
              {o.description && <p className="text-sm text-muted-foreground mt-1">{o.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentsSection({ documents, caseId }: { documents: CaseDocument[]; caseId: string }) {
  return (
    <div className={sectionCardClass}>
      <div className={sectionHeaderClass}>
        <h3 className="font-semibold text-foreground text-sm">Documents ({documents.length})</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
          <label className="cursor-pointer">
            Upload Document
            <input type="file" className="hidden" multiple onChange={async (e) => {
              const files = e.target.files
              if (!files?.length) return
              const formData = new FormData()
              Array.from(files).forEach(f => formData.append('files', f))
              try {
                const res = await fetch(`/api/cases/${caseId}/documents`, { method: 'POST', body: formData })
                if (!res.ok) throw new Error()
                toast.success('Document uploaded')
                window.location.reload()
              } catch {
                toast.error('Upload failed')
              }
            }} />
          </label>
        </Button>
      </div>
      {documents.length === 0 ? (
        <p className={emptyTextClass}>No documents uploaded.</p>
      ) : (
        <div className={dividerClass}>
          {documents.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{d.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {d.fileType} {d.fileSize ? `• ${Math.round(d.fileSize / 1024)}KB` : ''} • {formatDate(d.createdAt)}
                </p>
              </div>
              <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-foreground hover:underline font-medium">
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NotesSection({ notes, caseId }: { notes: CaseNote[]; caseId: string }) {
  const [adding, setAdding] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [purpose, setPurpose] = useState('')
  const router = useRouter()

  const handleAdd = async () => {
    if (!noteText.trim()) return
    try {
      const res = await fetch(`/api/cases/${caseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteText, purpose, noteDate: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error()
      toast.success('Note added')
      setNoteText('')
      setPurpose('')
      setAdding(false)
      router.refresh()
    } catch {
      toast.error('Failed to add note')
    }
  }

  return (
    <div className={sectionCardClass} id="notes">
      <div className={sectionHeaderClass}>
        <h3 className="font-semibold text-foreground text-sm">Notes ({notes.length})</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : 'Add Note'}
        </Button>
      </div>
      {adding && (
        <div className={addFormClass}>
          <div>
            <label className={inlineLabelClass}>Purpose / Heading</label>
            <input className={inlineInputClass} placeholder="e.g. Arguments"
              value={purpose} onChange={e => setPurpose(e.target.value)} />
          </div>
          <div>
            <label className={inlineLabelClass}>Note *</label>
            <textarea className={inlineInputClass + ' min-h-[100px]'} placeholder="Write your note here..."
              value={noteText} onChange={e => setNoteText(e.target.value)} />
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!noteText.trim()}>Save Note</Button>
        </div>
      )}
      {notes.length === 0 ? (
        <p className={emptyTextClass}>No notes yet.</p>
      ) : (
        <div className={dividerClass}>
          {notes.map((n) => (
            <div key={n.id} className="px-5 py-4">
              <div className="flex items-center justify-between mb-1">
                {n.purpose && <span className="text-xs font-medium text-foreground">{n.purpose}</span>}
                <span className="text-xs text-muted-foreground ml-auto">{formatDate(n.createdAt)}</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{n.noteText}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FeesSection({ fees, caseId }: { fees: Fee[]; caseId: string }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ amount: '', description: '', feeDate: '', paymentMode: 'Cash', isExpense: false })
  const router = useRouter()

  const totalIncome = fees.filter(f => !f.isExpense).reduce((sum, f) => sum + Number(f.amount), 0)
  const totalExpense = fees.filter(f => f.isExpense).reduce((sum, f) => sum + Number(f.amount), 0)

  const handleAdd = async () => {
    if (!form.amount) return
    try {
      const res = await fetch(`/api/cases/${caseId}/fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          description: form.description,
          feeDate: form.feeDate || new Date().toISOString(),
          paymentMode: form.paymentMode,
          isExpense: form.isExpense,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Fee entry added')
      setAdding(false)
      setForm({ amount: '', description: '', feeDate: '', paymentMode: 'Cash', isExpense: false })
      router.refresh()
    } catch {
      toast.error('Failed to add fee')
    }
  }

  return (
    <div className={sectionCardClass} id="fees">
      <div className={sectionHeaderClass}>
        <div>
          <h3 className="font-semibold text-foreground text-sm">Fees & Expenses</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Received: {formatCurrency(totalIncome)} | Expenses: {formatCurrency(totalExpense)}
          </p>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : 'Add Entry'}
        </Button>
      </div>
      {adding && (
        <div className={addFormClass}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={inlineLabelClass}>Amount (INR) *</label>
              <input type="number" className={inlineInputClass} placeholder="0.00"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className={inlineLabelClass}>Date</label>
              <input type="date" className={inlineInputClass}
                value={form.feeDate} onChange={e => setForm({ ...form, feeDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={inlineLabelClass}>Payment Mode</label>
              <select className={inlineInputClass} value={form.paymentMode}
                onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                {['Cash', 'UPI', 'Bank Transfer', 'Cheque'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground">
                <input type="checkbox" checked={form.isExpense}
                  onChange={e => setForm({ ...form, isExpense: e.target.checked })} />
                Mark as Expense
              </label>
            </div>
          </div>
          <div>
            <label className={inlineLabelClass}>Description</label>
            <input className={inlineInputClass} placeholder="e.g. Hearing fee"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!form.amount}>Save Entry</Button>
        </div>
      )}
      {fees.length === 0 ? (
        <p className={emptyTextClass}>No fee entries yet.</p>
      ) : (
        <div className={dividerClass}>
          {fees.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {f.isExpense ? '− ' : '+ '}
                  {formatCurrency(Number(f.amount))}
                  {f.paymentMode && <span className="text-xs text-muted-foreground ml-2">({f.paymentMode})</span>}
                </p>
                {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{f.feeDate ? formatDate(f.feeDate) : '—'}</p>
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  f.isExpense ? 'bg-secondary text-muted-foreground' : 'bg-secondary text-foreground font-medium'
                )}>
                  {f.isExpense ? 'Expense' : 'Income'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CounselSection({ clients, counsel }: {
  clients: (CaseClient & { client: Client })[]
  counsel: OpposeCounsel[]
}) {
  return (
    <div className="space-y-4">
      <div className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <h3 className="font-semibold text-foreground text-sm">Clients ({clients.length})</h3>
        </div>
        {clients.length === 0 ? (
          <p className={emptyTextClass}>No clients linked.</p>
        ) : (
          <div className={dividerClass}>
            {clients.map(({ client }) => (
              <div key={client.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{client.fullName}</p>
                  <p className="text-xs text-muted-foreground">{client.mobile} {client.email}</p>
                </div>
                <Link href={`/clients/${client.id}`} className="text-xs text-foreground hover:underline font-medium">
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <h3 className="font-semibold text-foreground text-sm">Opposite Counsel ({counsel.length})</h3>
        </div>
        {counsel.length === 0 ? (
          <p className={emptyTextClass}>No opposite counsel recorded.</p>
        ) : (
          <div className={dividerClass}>
            {counsel.map((c) => (
              <div key={c.id} className="px-5 py-3">
                <p className="text-sm font-medium text-foreground">{c.fullName}</p>
                <p className="text-xs text-muted-foreground">{c.mobile} {c.email}</p>
                {c.address && <p className="text-xs text-muted-foreground/60">{c.address}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RemindersSection({ reminders, caseId }: { reminders: Reminder[]; caseId: string }) {
  return (
    <div className={sectionCardClass}>
      <div className={sectionHeaderClass}>
        <h3 className="font-semibold text-foreground text-sm">Reminders ({reminders.length})</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
          <Link href={`/reminders?caseId=${caseId}`}>Manage Reminders</Link>
        </Button>
      </div>
      {reminders.length === 0 ? (
        <p className={emptyTextClass}>No active reminders.</p>
      ) : (
        <div className={dividerClass}>
          {reminders.map((r) => (
            <div key={r.id} className="px-5 py-3">
              <p className="text-sm font-medium text-foreground">{r.title}</p>
              <p className="text-xs text-muted-foreground">
                {r.frequency} {r.startDate ? `• Starts ${formatDate(r.startDate)}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LinkedSection({ linkedFrom, linkedTo }: {
  linkedFrom: (LinkedCase & { linkedCase: Pick<Case, 'id' | 'caseNumber' | 'firstParty' | 'oppositeParty' | 'status'> })[]
  linkedTo: (LinkedCase & { case: Pick<Case, 'id' | 'caseNumber' | 'firstParty' | 'oppositeParty' | 'status'> })[]
}) {
  const allLinked = [
    ...linkedFrom.map(l => l.linkedCase),
    ...linkedTo.map(l => l.case),
  ]

  return (
    <div className={sectionCardClass}>
      <div className={sectionHeaderClass}>
        <h3 className="font-semibold text-foreground text-sm">Linked Cases ({allLinked.length})</h3>
      </div>
      {allLinked.length === 0 ? (
        <p className={emptyTextClass}>No linked cases.</p>
      ) : (
        <div className={dividerClass}>
          {allLinked.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {c.firstParty} vs {c.oppositeParty}
                </p>
                <p className="text-xs text-muted-foreground">{c.caseNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <CaseStatusBadge status={c.status} />
                <Link href={`/cases/${c.id}`} className="text-xs text-foreground hover:underline font-medium">
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
