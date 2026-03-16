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
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cases">
              <ArrowLeft size={16} />
              Cases
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {caseData.cnrNumber && (
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              <RefreshCw size={14} className={syncing ? 'animate-spin mr-2' : 'mr-2'} />
              Sync eCourts
            </Button>
          )}
          <Button asChild size="sm">
            <Link href={`/cases/${caseData.id}/edit`}>
              <Pencil size={14} className="mr-2" />
              Edit Case
            </Link>
          </Button>
        </div>
      </div>

      {/* Case title card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {caseData.courtType && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {caseData.courtType.toUpperCase()}
                </span>
              )}
              <span className="font-mono text-sm text-slate-600">
                {caseData.caseNumber ?? 'No Number'}
                {caseData.year ? ` / ${caseData.year}` : ''}
              </span>
              <CaseStatusBadge status={caseData.status} />
              {caseData.isImportant && (
                <Star size={16} className="text-amber-500 fill-amber-500" />
              )}
            </div>
            <h1 className="text-xl font-semibold text-slate-900 truncate">
              {caseData.firstParty ?? '—'}{' '}
              <span className="font-normal text-slate-400 text-lg">vs</span>{' '}
              {caseData.oppositeParty ?? '—'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{caseData.courtName}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-slate-500 mb-0.5">Next Hearing</div>
            <div className="font-semibold text-slate-900">
              {caseData.nextDate ? formatDate(caseData.nextDate) : 'Date Awaited'}
            </div>
            {caseData.fixedFor && (
              <div className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                {caseData.fixedFor}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{caseData.history.length}</p>
            <p className="text-xs text-slate-500">Hearings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{caseData.documents.length}</p>
            <p className="text-xs text-slate-500">Documents</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{caseData.notes.length}</p>
            <p className="text-xs text-slate-500">Notes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalFees)}</p>
            <p className="text-xs text-slate-500">Fees</p>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-200">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md whitespace-nowrap transition-colors ${
              activeSection === section.id
                ? 'text-indigo-700 border-b-2 border-indigo-600 -mb-px bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <section.icon size={14} />
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
          <CounselSection
            clients={caseData.clients}
            counsel={caseData.oppositeCouns}
          />
        )}
        {activeSection === 'reminders' && <RemindersSection reminders={caseData.reminders} caseId={caseData.id} />}
        {activeSection === 'linked' && (
          <LinkedSection linkedFrom={caseData.linkedFrom} linkedTo={caseData.linkedTo} />
        )}
      </div>
    </div>
  )
}

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
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Case Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {fields.map(({ label, value }) => value ? (
            <div key={label} className="flex gap-2">
              <span className="text-sm text-slate-500 w-36 shrink-0">{label}</span>
              <span className="text-sm text-slate-900 font-medium">{value}</span>
            </div>
          ) : null)}
        </div>
      </div>

      {(c.briefFacts || c.relevantLaws || c.comments) && (
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Notes & Background</h3>
          {c.briefFacts && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Brief Facts</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.briefFacts}</p>
            </div>
          )}
          {c.relevantLaws && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Relevant Laws</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.relevantLaws}</p>
            </div>
          )}
          {c.comments && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Comments</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.comments}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function HistorySection({ history }: { history: CaseHistory[] }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Hearing History ({history.length})</h3>
      </div>
      {history.length === 0 ? (
        <p className="text-sm text-slate-500 px-5 py-8 text-center">No hearing history available.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {history.map((h) => (
            <div key={h.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {h.hearingDate ? formatDate(h.hearingDate) : '—'}
                </p>
                {h.purpose && <p className="text-xs text-slate-500">{h.purpose}</p>}
                {h.judge && <p className="text-xs text-slate-400">Judge: {h.judge}</p>}
              </div>
              {h.businessOnDate && (
                <p className="text-xs text-slate-500">
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
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Orders ({orders.length})</h3>
        <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : 'Add Order'}
        </Button>
      </div>
      {adding && (
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Order Type</label>
              <input
                className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
                placeholder="Interim / Final"
                value={form.orderType}
                onChange={e => setForm({ ...form, orderType: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Order Date</label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
                value={form.orderDate}
                onChange={e => setForm({ ...form, orderDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Description</label>
            <textarea
              className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm min-h-[60px]"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Order URL (optional)</label>
            <input
              className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
              placeholder="https://..."
              value={form.orderUrl}
              onChange={e => setForm({ ...form, orderUrl: e.target.value })}
            />
          </div>
          <Button size="sm" onClick={handleAdd}>Save Order</Button>
        </div>
      )}
      {orders.length === 0 ? (
        <p className="text-sm text-slate-500 px-5 py-8 text-center">No orders recorded.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {orders.map((o) => (
            <div key={o.id} className="px-5 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full mr-2">{o.orderType ?? 'Order'}</span>
                  <span className="text-sm font-medium text-slate-900">
                    {o.orderDate ? formatDate(o.orderDate) : '—'}
                  </span>
                </div>
                {o.orderUrl && (
                  <a href={o.orderUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline">
                    View Order
                  </a>
                )}
              </div>
              {o.description && <p className="text-sm text-slate-600 mt-1">{o.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentsSection({ documents, caseId }: { documents: CaseDocument[]; caseId: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Documents ({documents.length})</h3>
        <Button size="sm" variant="outline" asChild>
          <label className="cursor-pointer">
            Upload Document
            <input type="file" className="hidden" multiple onChange={async (e) => {
              const files = e.target.files
              if (!files?.length) return
              const formData = new FormData()
              Array.from(files).forEach(f => formData.append('files', f))
              try {
                const res = await fetch(`/api/cases/${caseId}/documents`, {
                  method: 'POST',
                  body: formData,
                })
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
        <p className="text-sm text-slate-500 px-5 py-8 text-center">No documents uploaded.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {documents.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{d.fileName}</p>
                <p className="text-xs text-slate-500">
                  {d.fileType} {d.fileSize ? `• ${Math.round(d.fileSize / 1024)}KB` : ''} •{' '}
                  {formatDate(d.createdAt)}
                </p>
              </div>
              <a
                href={d.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:underline"
              >
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
    <div className="bg-white rounded-lg border border-slate-200" id="notes">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Notes ({notes.length})</h3>
        <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : 'Add Note'}
        </Button>
      </div>
      {adding && (
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Purpose / Heading</label>
            <input
              className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
              placeholder="e.g. Arguments"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Note *</label>
            <textarea
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm min-h-[100px]"
              placeholder="Write your note here..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!noteText.trim()}>Save Note</Button>
        </div>
      )}
      {notes.length === 0 ? (
        <p className="text-sm text-slate-500 px-5 py-8 text-center">No notes yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {notes.map((n) => (
            <div key={n.id} className="px-5 py-4">
              <div className="flex items-center justify-between mb-1">
                {n.purpose && <span className="text-xs font-medium text-indigo-600">{n.purpose}</span>}
                <span className="text-xs text-slate-400 ml-auto">{formatDate(n.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.noteText}</p>
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
    <div className="bg-white rounded-lg border border-slate-200" id="fees">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="font-semibold text-slate-900">Fees & Expenses</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Received: {formatCurrency(totalIncome)} | Expenses: {formatCurrency(totalExpense)}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : 'Add Entry'}
        </Button>
      </div>
      {adding && (
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Amount (INR) *</label>
              <input
                type="number"
                className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Date</label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
                value={form.feeDate}
                onChange={e => setForm({ ...form, feeDate: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Payment Mode</label>
              <select
                className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
                value={form.paymentMode}
                onChange={e => setForm({ ...form, paymentMode: e.target.value })}
              >
                {['Cash', 'UPI', 'Bank Transfer', 'Cheque'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isExpense}
                  onChange={e => setForm({ ...form, isExpense: e.target.checked })}
                />
                Mark as Expense
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Description</label>
            <input
              className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
              placeholder="e.g. Hearing fee"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!form.amount}>Save Entry</Button>
        </div>
      )}
      {fees.length === 0 ? (
        <p className="text-sm text-slate-500 px-5 py-8 text-center">No fee entries yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {fees.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {f.isExpense ? '- ' : '+ '}
                  {formatCurrency(Number(f.amount))}
                  {f.paymentMode && <span className="text-xs text-slate-400 ml-2">({f.paymentMode})</span>}
                </p>
                {f.description && <p className="text-xs text-slate-500">{f.description}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">{f.feeDate ? formatDate(f.feeDate) : '—'}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${f.isExpense ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
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
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Clients ({clients.length})</h3>
        </div>
        {clients.length === 0 ? (
          <p className="text-sm text-slate-500 px-5 py-6 text-center">No clients linked.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {clients.map(({ client }) => (
              <div key={client.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{client.fullName}</p>
                  <p className="text-xs text-slate-500">{client.mobile} {client.email}</p>
                </div>
                <Link href={`/clients/${client.id}`} className="text-xs text-indigo-600 hover:underline">
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Opposite Counsel ({counsel.length})</h3>
        </div>
        {counsel.length === 0 ? (
          <p className="text-sm text-slate-500 px-5 py-6 text-center">No opposite counsel recorded.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {counsel.map((c) => (
              <div key={c.id} className="px-5 py-3">
                <p className="text-sm font-medium text-slate-900">{c.fullName}</p>
                <p className="text-xs text-slate-500">{c.mobile} {c.email}</p>
                {c.address && <p className="text-xs text-slate-400">{c.address}</p>}
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
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Reminders ({reminders.length})</h3>
        <Button size="sm" variant="outline" asChild>
          <Link href={`/reminders?caseId=${caseId}`}>Manage Reminders</Link>
        </Button>
      </div>
      {reminders.length === 0 ? (
        <p className="text-sm text-slate-500 px-5 py-8 text-center">No active reminders.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {reminders.map((r) => (
            <div key={r.id} className="px-5 py-3">
              <p className="text-sm font-medium text-slate-900">{r.title}</p>
              <p className="text-xs text-slate-500">
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
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Linked Cases ({allLinked.length})</h3>
      </div>
      {allLinked.length === 0 ? (
        <p className="text-sm text-slate-500 px-5 py-8 text-center">No linked cases.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {allLinked.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {c.firstParty} vs {c.oppositeParty}
                </p>
                <p className="text-xs text-slate-500">{c.caseNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <CaseStatusBadge status={c.status} />
                <Link href={`/cases/${c.id}`} className="text-xs text-indigo-600 hover:underline">
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
