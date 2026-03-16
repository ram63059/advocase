# Stage 7: Case Detail Page

## Goal
Build `/cases/[id]` — dedicated scrollable page with 9 sections: overview, hearing history, orders, documents, notes, clients & fees, opposite counsel, reminders, linked cases.

---

## File: `app/(dashboard)/cases/[id]/page.tsx`

Server Component — fetches all case data with relations in one query.

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { CaseDetailClient } from '@/components/cases/CaseDetailClient'

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.userId

  const caseData = await prisma.case.findUnique({
    where: { id: params.id, profileId: userId },
    include: {
      history:       { orderBy: { hearingDate: 'desc' } },
      orders:        { orderBy: { orderDate: 'desc' } },
      notes:         { orderBy: { createdAt: 'desc' } },
      documents:     { orderBy: { createdAt: 'desc' } },
      clients:       { include: { client: true } },
      oppositeCouns: true,
      fees:          { orderBy: { feeDate: 'desc' } },
      reminders:     { where: { isActive: true }, orderBy: { startDate: 'asc' } },
      linkedFrom:    { include: { linkedCase: { select: { id: true, caseNumber: true, firstParty: true, oppositeParty: true, status: true } } } },
      linkedTo:      { include: { case: { select: { id: true, caseNumber: true, firstParty: true, oppositeParty: true, status: true } } } },
    }
  })

  if (!caseData) notFound()

  return <CaseDetailClient caseData={caseData} userId={userId} />
}
```

---

## Client Component: `components/cases/CaseDetailClient.tsx`

This is a client component that renders all 9 sections.

```typescript
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Pencil, RefreshCw, Download, MoreHorizontal,
  Star, Calendar, FileText, Receipt, Users, Link2, Bell, Scale, Gavel
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Section components (defined below)
import { CaseOverview } from './detail/CaseOverview'
import { CaseTimeline } from './detail/CaseTimeline'
import { CaseOrders } from './detail/CaseOrders'
import { CaseDocuments } from './detail/CaseDocuments'
import { CaseNotes } from './detail/CaseNotes'
import { CaseFees } from './detail/CaseFees'
import { OppositeCounsel } from './detail/OppositeCounsel'
import { CaseReminders } from './detail/CaseReminders'
import { LinkedCases } from './detail/LinkedCases'
import { CaseStatusBadge } from './CaseStatusBadge'

export function CaseDetailClient({ caseData, userId }) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)

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
      toast.error('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div>
        <Link
          href="/cases"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ArrowLeft size={14} />
          Back to Cases
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-slate-500">{caseData.cnrNumber}</span>
              <CaseStatusBadge status={caseData.status} />
              {caseData.isImportant && (
                <Star size={16} className="text-amber-500 fill-amber-500" />
              )}
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {caseData.caseNumber ?? 'No Case Number'}
            </h1>
            <p className="text-slate-600 mt-0.5">
              {caseData.firstParty} <span className="text-slate-400">vs</span> {caseData.oppositeParty}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">{caseData.courtName}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="gap-1"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              Sync
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/cases/${caseData.id}/edit`}>
                <Pencil size={14} className="mr-1" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/api/export/ledger?case_id=${caseData.id}`, '_blank')}
            >
              <Download size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Section 1: Overview ─── */}
      <CaseOverview caseData={caseData} />

      {/* ─── Section 2: Hearing History ─── */}
      <CaseTimeline caseId={caseData.id} history={caseData.history} />

      {/* ─── Section 3: Orders ─── */}
      <CaseOrders caseId={caseData.id} orders={caseData.orders} />

      {/* ─── Section 4: Documents ─── */}
      <CaseDocuments caseId={caseData.id} documents={caseData.documents} />

      {/* ─── Section 5: Notes ─── */}
      <CaseNotes caseId={caseData.id} notes={caseData.notes} userId={userId} />

      {/* ─── Section 6: Clients & Fees ─── */}
      <CaseFees
        caseId={caseData.id}
        clients={caseData.clients}
        fees={caseData.fees}
      />

      {/* ─── Section 7: Opposite Counsel ─── */}
      <OppositeCounsel caseId={caseData.id} counsels={caseData.oppositeCouns} />

      {/* ─── Section 8: Reminders ─── */}
      <CaseReminders caseId={caseData.id} reminders={caseData.reminders} />

      {/* ─── Section 9: Linked Cases ─── */}
      <LinkedCases
        caseId={caseData.id}
        linkedFrom={caseData.linkedFrom}
        linkedTo={caseData.linkedTo}
      />
    </div>
  )
}
```

---

## Section 1: `components/cases/detail/CaseOverview.tsx`

```typescript
// 2-column grid showing all case fields
// Left: Case No., CNR, File No., Reference No., Year, Court No., Court, Judge
// Right: Type, Under Section, Police Station, FIR No., Company, Empanelment
// Full width: Filing Date, Previous Date, Next Date + Fixed For badge
// Full width: Brief Facts (expandable with "Show more" after 3 lines)
// Full width: Relevant Laws

export function CaseOverview({ caseData }) {
  const [showFullFacts, setShowFullFacts] = useState(false)

  const fields = [
    { label: 'Case Number',   value: caseData.caseNumber },
    { label: 'CNR Number',    value: caseData.cnrNumber },
    { label: 'File No.',      value: caseData.fileNo },
    { label: 'Reference No.', value: caseData.referenceNo },
    { label: 'Year',          value: caseData.year?.toString() },
    { label: 'Court No.',     value: caseData.courtNo },
    { label: 'Court',         value: caseData.courtName },
    { label: 'Judge',         value: caseData.judgeName },
    { label: 'Case Type',     value: caseData.caseType },
    { label: 'Under Section', value: caseData.underSection },
    { label: 'Police Station',value: caseData.policeStation },
    { label: 'FIR Number',    value: caseData.firNumber },
    { label: 'Company',       value: caseData.company },
    { label: 'Empanelment',   value: caseData.empanelment },
  ]

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Scale size={18} className="text-indigo-600" />
        Case Overview
      </h2>

      {/* Fields grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {fields.map(({ label, value }) => value && (
          <div key={label}>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm font-medium text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Dates row */}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-slate-500">Filing Date</p>
          <p className="text-sm font-medium">{formatDate(caseData.filingDate)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Previous Date</p>
          <p className="text-sm font-medium">{formatDate(caseData.previousDate)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Next Date</p>
          <p className="text-sm font-medium text-indigo-700">
            {caseData.nextDate ? formatDate(caseData.nextDate) : 'Awaited'}
          </p>
          {caseData.fixedFor && (
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full mt-1 inline-block">
              {caseData.fixedFor}
            </span>
          )}
        </div>
      </div>

      {/* Brief facts */}
      {caseData.briefFacts && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Brief Facts</p>
          <p className={`text-sm text-slate-700 ${!showFullFacts ? 'line-clamp-3' : ''}`}>
            {caseData.briefFacts}
          </p>
          {caseData.briefFacts.length > 200 && (
            <button
              onClick={() => setShowFullFacts(!showFullFacts)}
              className="text-xs text-indigo-600 mt-1 hover:underline"
            >
              {showFullFacts ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Relevant laws */}
      {caseData.relevantLaws && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-1">Relevant Laws</p>
          <p className="text-sm text-slate-700">{caseData.relevantLaws}</p>
        </div>
      )}
    </section>
  )
}
```

---

## Section 2: `components/cases/detail/CaseTimeline.tsx`

```typescript
// Vertical timeline of hearing history
// Each entry: date (left), purpose + judge (right)
// "Load from eCourts" button at top

export function CaseTimeline({ caseId, history }) {
  return (
    <section className="bg-white rounded-lg border border-slate-200 p-5" id="history">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Calendar size={18} className="text-indigo-600" />
          Hearing History
        </h2>
        <Button variant="outline" size="sm" onClick={/* loadFromEcourts */}>
          Load from eCourts
        </Button>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">No hearing history yet.</p>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />

          <div className="space-y-4">
            {history.map((entry, i) => (
              <div key={entry.id} className="flex gap-4 pl-2">
                {/* Dot */}
                <div className="relative z-10 w-5 h-5 rounded-full bg-indigo-100 border-2 border-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {formatDate(entry.hearingDate ?? entry.businessOnDate)}
                  </p>
                  <p className="text-sm text-slate-600">{entry.purpose ?? 'Hearing'}</p>
                  {entry.judge && (
                    <p className="text-xs text-slate-400">Judge: {entry.judge}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
```

---

## Section 4: `components/cases/detail/CaseDocuments.tsx`

```typescript
// Drag & drop file upload + file list
// Upload via Supabase Storage API
// Files stored at: case-documents/{caseId}/{filename}

export function CaseDocuments({ caseId, documents }) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (files: FileList) => {
    setUploading(true)
    const supabase = createClient()

    for (const file of Array.from(files)) {
      const path = `${caseId}/${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage
        .from('case-documents')
        .upload(path, file)

      if (!error) {
        // Save document record via API
        await fetch(`/api/cases/${caseId}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileUrl: data.path,
            fileSize: file.size,
            fileType: file.type,
          }),
        })
      }
    }
    setUploading(false)
    router.refresh()
  }

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-5" id="documents">
      <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <FileText size={18} className="text-indigo-600" />
        Documents
      </h2>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-indigo-300 transition-colors cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files) }}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
        <p className="text-sm text-slate-500">
          {uploading ? 'Uploading…' : 'Drag & drop files here, or click to upload'}
        </p>
      </div>

      {/* File list */}
      {documents.length > 0 && (
        <div className="mt-4 space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{doc.fileName}</p>
                  <p className="text-xs text-slate-500">{formatDate(doc.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={/* signed URL from Supabase */`/api/documents/${doc.id}/download`}
                  target="_blank"
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Download
                </a>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
```

---

## Section 5: `components/cases/detail/CaseNotes.tsx`

```typescript
// Note composer + notes list
// Fields: date, purpose (Fixed For style), note text

export function CaseNotes({ caseId, notes, userId }) {
  const [adding, setAdding] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  const onAddNote = async (values) => {
    await fetch(`/api/cases/${caseId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    reset()
    setAdding(false)
    router.refresh()
  }

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-5" id="notes">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900">Notes</h2>
        <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}>
          <Plus size={14} className="mr-1" /> Add Note
        </Button>
      </div>

      {/* Add note form */}
      {adding && (
        <form onSubmit={handleSubmit(onAddNote)} className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" {...register('noteDate')} />
            </div>
            <div>
              <Label>Purpose</Label>
              <Input placeholder="e.g. For Arguments" {...register('purpose')} />
            </div>
          </div>
          <div>
            <Label>Note</Label>
            <Textarea placeholder="Enter case notes…" rows={4} {...register('noteText', { required: true })} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Save Note</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Notes list */}
      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="border-l-2 border-indigo-200 pl-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">{formatDate(note.noteDate)}</span>
                {note.purpose && (
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{note.purpose}</span>
                )}
              </div>
              <button className="text-slate-400 hover:text-red-500">
                <Trash2 size={13} />
              </button>
            </div>
            <p className="text-sm text-slate-700 mt-1">{note.noteText}</p>
          </div>
        ))}
        {notes.length === 0 && !adding && (
          <p className="text-sm text-slate-400">No notes yet.</p>
        )}
      </div>
    </section>
  )
}
```

---

## Section 6: `components/cases/detail/CaseFees.tsx`

```typescript
// Left: Linked clients
// Right: Fee ledger table with total

// Fee table columns: Date, Description, Mode, Amount (positive=fee, negative=expense)
// Running total at bottom
// "Add Payment" → opens inline form or sheet
// "Generate Invoice" → calls /api/export/invoice?fee_id=...

// Fee row format:
// | 15 Mar 2026 | Hearing fee | UPI | ₹5,000 |
// | 20 Feb 2026 | Court expenses | Cash | -₹500 |
// ─────────────────────────────────────────────
// Total received: ₹5,000  |  Expenses: ₹500  |  Net: ₹4,500
```

---

## API Routes for Case Detail (CRUD)

Create these route handlers:

### `app/api/cases/[id]/notes/route.ts`
```typescript
// POST: add note to case
// DELETE: delete note (param: noteId in body)
// Validates: caseId belongs to current user
// Uses: prisma.caseNote.create({ data: { caseId, profileId: userId, ...body } })
```

### `app/api/cases/[id]/documents/route.ts`
```typescript
// POST: save document record after Supabase Storage upload
// DELETE: delete document + remove from Supabase Storage
```

### `app/api/cases/[id]/fees/route.ts`
```typescript
// GET: list fees (already included in case detail page query)
// POST: add fee record
// DELETE: delete fee record
```

### `app/api/cases/[id]/route.ts`
```typescript
// PATCH: update case (used for inline edits like isImportant toggle)
// DELETE: delete case (with confirmation)
```

---

## Verification Checklist
- [ ] All 9 sections render correctly with real data
- [ ] Case header shows case number, parties, court, status
- [ ] Edit button navigates to `/cases/[id]/edit`
- [ ] Sync button calls eCourts API and refreshes
- [ ] Timeline renders hearing history in descending order
- [ ] Documents upload to Supabase Storage and appear in list
- [ ] Note composer saves and refreshes note list
- [ ] Fee table shows all fees with running totals
- [ ] Linked cases section shows both directions of links
- [ ] Page handles `notFound()` gracefully when case doesn't exist
- [ ] Breadcrumb "Back to Cases" works
