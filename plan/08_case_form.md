# Stage 8: Add / Edit Case Form

## Goal
Build `/cases/new` and `/cases/[id]/edit` — a clean form with court type selector, CNR auto-fill from eCourts, all case fields, and client/advocate linking.

---

## Files to Create
- `app/(dashboard)/cases/new/page.tsx`
- `app/(dashboard)/cases/[id]/edit/page.tsx`
- `components/cases/CaseForm.tsx`
- `components/cases/CourtTypeSelector.tsx`
- `components/cases/CnrAutoFill.tsx`

---

## Step 1: Zod Validation Schema (`lib/validations/case.ts`)

```typescript
import { z } from 'zod'

export const caseSchema = z.object({
  // Court info
  courtType:    z.string().min(1, 'Court type is required'),
  state:        z.string().optional(),
  district:     z.string().optional(),
  courtComplex: z.string().optional(),
  courtName:    z.string().optional(),
  courtNo:      z.string().optional(),

  // Identifiers
  caseNumber:   z.string().optional(),
  cnrNumber:    z.string().optional(),
  referenceNo:  z.string().optional(),
  fileNo:       z.string().optional(),
  fileName:     z.string().optional(),
  year:         z.number().int().min(1900).max(2100).optional().nullable(),

  // Parties
  firstParty:   z.string().optional(),
  oppositeParty: z.string().optional(),

  // Details
  caseType:     z.string().optional(),
  underSection: z.string().optional(),
  policeStation: z.string().optional(),
  firNumber:    z.string().optional(),
  judgeName:    z.string().optional(),
  company:      z.string().optional(),
  empanelment:  z.string().optional(),
  comments:     z.string().optional(),

  // Dates
  filingDate:   z.string().optional(),
  previousDate: z.string().optional(),
  nextDate:     z.string().optional(),
  fixedFor:     z.string().optional(),

  // Status
  status:       z.enum(['running', 'decided', 'abandoned']).default('running'),
  isImportant:  z.boolean().default(false),

  // Notes
  briefFacts:   z.string().optional(),
  relevantLaws: z.string().optional(),

  // Client IDs to link
  clientIds:    z.array(z.string()).optional(),
})

export type CaseFormValues = z.infer<typeof caseSchema>
```

---

## Step 2: New Case Page (`app/(dashboard)/cases/new/page.tsx`)

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CaseForm } from '@/components/cases/CaseForm'

export default async function NewCasePage({
  searchParams
}: {
  searchParams: { import?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.userId

  // Load custom field options for dropdowns
  const [caseTypes, courts, underSections, empanelments] = await Promise.all([
    prisma.customField.findMany({ where: { profileId: userId, fieldType: 'casetype' }, orderBy: { sortOrder: 'asc' } }),
    prisma.customField.findMany({ where: { profileId: userId, fieldType: 'court' }, orderBy: { sortOrder: 'asc' } }),
    prisma.customField.findMany({ where: { profileId: userId, fieldType: 'us' }, orderBy: { sortOrder: 'asc' } }),
    prisma.customField.findMany({ where: { profileId: userId, fieldType: 'empanelment' }, orderBy: { sortOrder: 'asc' } }),
  ])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cases" className="text-sm text-slate-500 hover:text-slate-700">
          ← Cases
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-semibold text-slate-900">Add Case</h1>
      </div>

      <CaseForm
        mode="create"
        customFields={{ caseTypes, courts, underSections, empanelments }}
        profileId={userId}
      />
    </div>
  )
}
```

---

## Step 3: Edit Case Page (`app/(dashboard)/cases/[id]/edit/page.tsx`)

```typescript
export default async function EditCasePage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.userId

  const [caseData, caseTypes, courts, underSections, empanelments] = await Promise.all([
    prisma.case.findUnique({
      where: { id: params.id, profileId: userId },
      include: { clients: { include: { client: true } } }
    }),
    prisma.customField.findMany({ where: { profileId: userId, fieldType: 'casetype' }, orderBy: { sortOrder: 'asc' } }),
    prisma.customField.findMany({ where: { profileId: userId, fieldType: 'court' }, orderBy: { sortOrder: 'asc' } }),
    prisma.customField.findMany({ where: { profileId: userId, fieldType: 'us' }, orderBy: { sortOrder: 'asc' } }),
    prisma.customField.findMany({ where: { profileId: userId, fieldType: 'empanelment' }, orderBy: { sortOrder: 'asc' } }),
  ])

  if (!caseData) notFound()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/cases/${params.id}`} className="text-sm text-slate-500 hover:text-slate-700">
          ← Case Detail
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-semibold text-slate-900">Edit Case</h1>
      </div>

      <CaseForm
        mode="edit"
        caseId={params.id}
        defaultValues={caseData}
        customFields={{ caseTypes, courts, underSections, empanelments }}
        profileId={userId}
      />
    </div>
  )
}
```

---

## Step 4: CaseForm Component (`components/cases/CaseForm.tsx`)

Client Component. Sections are stacked cards.

```typescript
'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { caseSchema, CaseFormValues } from '@/lib/validations/case'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { CourtTypeSelector } from './CourtTypeSelector'
import { CnrAutoFill } from './CnrAutoFill'
import { ClientLinkModal } from './ClientLinkModal'
import { DEFAULT_FIXED_FOR } from '@/lib/constants'

export function CaseForm({ mode, caseId, defaultValues, customFields, profileId }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [selectedClients, setSelectedClients] = useState(
    defaultValues?.clients?.map(cc => cc.client) ?? []
  )

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: defaultValues ? {
      ...defaultValues,
      filingDate: defaultValues.filingDate?.toISOString().split('T')[0] ?? '',
      previousDate: defaultValues.previousDate?.toISOString().split('T')[0] ?? '',
      nextDate: defaultValues.nextDate?.toISOString().split('T')[0] ?? '',
    } : {
      status: 'running',
      isImportant: false,
    }
  })

  const onSubmit = async (values: CaseFormValues) => {
    setSaving(true)
    try {
      const url = mode === 'create' ? '/api/cases' : `/api/cases/${caseId}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          clientIds: selectedClients.map(c => c.id),
        }),
      })

      if (!res.ok) throw new Error('Failed to save case')

      const data = await res.json()
      toast.success(mode === 'create' ? 'Case added successfully' : 'Case updated')
      router.push(`/cases/${data.id}`)
    } catch {
      toast.error('Failed to save case. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Handle CNR auto-fill
  const handleCnrFill = (caseDetails) => {
    Object.entries(caseDetails).forEach(([key, value]) => {
      form.setValue(key as keyof CaseFormValues, value as any)
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

      {/* ─── CNR Auto-Fill ─── */}
      <CnrAutoFill onFill={handleCnrFill} />

      {/* ─── Court Type Selector ─── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Court Type</h2>
        <Controller
          control={form.control}
          name="courtType"
          render={({ field }) => (
            <CourtTypeSelector value={field.value} onChange={field.onChange} />
          )}
        />
        {form.formState.errors.courtType && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.courtType.message}</p>
        )}

        {/* Dynamic sub-fields based on court type */}
        {['district'].includes(form.watch('courtType')) && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <Label>State</Label>
              <Input {...form.register('state')} placeholder="e.g. Telangana" />
            </div>
            <div>
              <Label>District</Label>
              <Input {...form.register('district')} placeholder="e.g. Hyderabad" />
            </div>
            <div className="col-span-2">
              <Label>Court Complex</Label>
              <Input {...form.register('courtComplex')} placeholder="e.g. City Civil Court Complex" />
            </div>
          </div>
        )}
      </div>

      {/* ─── Case Identification ─── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Case Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Case Number</Label>
            <Input {...form.register('caseNumber')} placeholder="e.g. CRL.P 1234" />
          </div>
          <div>
            <Label>Year</Label>
            <Input type="number" {...form.register('year', { valueAsNumber: true })} placeholder="e.g. 2024" />
          </div>
          <div>
            <Label>CNR Number</Label>
            <Input {...form.register('cnrNumber')} placeholder="e.g. TGHC010..." className="font-mono" />
          </div>
          <div>
            <Label>Reference No.</Label>
            <Input {...form.register('referenceNo')} />
          </div>
          <div>
            <Label>File No.</Label>
            <Input {...form.register('fileNo')} />
          </div>
          <div>
            <Label>File Name</Label>
            <Input {...form.register('fileName')} />
          </div>
          <div>
            <Label>Court No.</Label>
            <Input {...form.register('courtNo')} />
          </div>
          <div>
            <Label>Court Name</Label>
            <Input {...form.register('courtName')} placeholder="e.g. II Addl. Sessions Court" />
          </div>
          <div className="sm:col-span-2">
            <Label>Judge Name</Label>
            <Input {...form.register('judgeName')} />
          </div>
        </div>
      </div>

      {/* ─── Parties ─── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Parties</h2>
        <div className="space-y-4">
          <div>
            <Label>First Party *</Label>
            <Textarea {...form.register('firstParty')} rows={2} placeholder="e.g. Ram Prasad S/o Rao Prasad" />
          </div>
          <div>
            <Label>Opposite Party *</Label>
            <Textarea {...form.register('oppositeParty')} rows={2} placeholder="e.g. State of Telangana" />
          </div>
        </div>
      </div>

      {/* ─── Case Classification ─── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Classification</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Type of Case</Label>
            <Controller
              control={form.control}
              name="caseType"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {customFields.caseTypes.map(ct => (
                      <SelectItem key={ct.id} value={ct.value}>{ct.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>Under Section</Label>
            <Controller
              control={form.control}
              name="underSection"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>
                    {customFields.underSections.map(us => (
                      <SelectItem key={us.id} value={us.value}>{us.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>Police Station</Label>
            <Input {...form.register('policeStation')} />
          </div>
          <div>
            <Label>FIR Number</Label>
            <Input {...form.register('firNumber')} />
          </div>
          <div>
            <Label>Company / Bank</Label>
            <Input {...form.register('company')} />
          </div>
          <div>
            <Label>Empanelment</Label>
            <Controller
              control={form.control}
              name="empanelment"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <SelectTrigger><SelectValue placeholder="Select empanelment" /></SelectTrigger>
                  <SelectContent>
                    {customFields.empanelments.map(e => (
                      <SelectItem key={e.id} value={e.value}>{e.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      {/* ─── Dates ─── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Hearing Dates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Filing Date</Label>
            <Input type="date" {...form.register('filingDate')} />
          </div>
          <div>
            <Label>Previous Date</Label>
            <Input type="date" {...form.register('previousDate')} />
          </div>
          <div>
            <Label>Next Date</Label>
            <Input type="date" {...form.register('nextDate')} />
          </div>
          <div className="sm:col-span-3">
            <Label>Fixed For</Label>
            <Controller
              control={form.control}
              name="fixedFor"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                  <SelectContent>
                    {DEFAULT_FIXED_FOR.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      {/* ─── Status Flags ─── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Status</h2>
        <div className="flex items-center gap-6">
          {(['running', 'decided', 'abandoned'] as const).map((s) => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={s}
                {...form.register('status')}
                className="text-indigo-600"
              />
              <span className="text-sm capitalize">{s}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Controller
            control={form.control}
            name="isImportant"
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                id="isImportant"
              />
            )}
          />
          <label htmlFor="isImportant" className="text-sm cursor-pointer">
            Mark as Important ⭐
          </label>
        </div>
      </div>

      {/* ─── Notes ─── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Notes</h2>
        <div className="space-y-4">
          <div>
            <Label>Brief Facts</Label>
            <Textarea {...form.register('briefFacts')} rows={4} placeholder="Brief summary of the case…" />
          </div>
          <div>
            <Label>Relevant Laws / Sections</Label>
            <Textarea {...form.register('relevantLaws')} rows={2} placeholder="e.g. IPC 302, CPC 151…" />
          </div>
          <div>
            <Label>Comments</Label>
            <Textarea {...form.register('comments')} rows={2} />
          </div>
        </div>
      </div>

      {/* ─── Link Clients ─── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Link Clients</h2>
          <ClientLinkModal
            profileId={profileId}
            selectedClients={selectedClients}
            onSelect={setSelectedClients}
          />
        </div>
        {selectedClients.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedClients.map(client => (
              <div key={client.id} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm">
                {client.fullName}
                <button
                  type="button"
                  onClick={() => setSelectedClients(prev => prev.filter(c => c.id !== client.id))}
                  className="text-indigo-400 hover:text-indigo-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No clients linked yet.</p>
        )}
      </div>

      {/* ─── Submit ─── */}
      <div className="flex items-center gap-3 pb-8">
        <Button type="submit" disabled={saving} className="sm:w-auto w-full">
          {saving ? 'Saving…' : mode === 'create' ? 'Add Case' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

---

## Step 5: Court Type Selector (`components/cases/CourtTypeSelector.tsx`)

```typescript
'use client'
import { COURT_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface CourtTypeSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function CourtTypeSelector({ value, onChange }: CourtTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {COURT_TYPES.map((ct) => (
        <button
          key={ct.value}
          type="button"
          onClick={() => onChange(ct.value)}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium border transition-colors',
            value === ct.value
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
          )}
        >
          {ct.label}
        </button>
      ))}
    </div>
  )
}
```

---

## Step 6: CNR Auto-Fill (`components/cases/CnrAutoFill.tsx`)

```typescript
'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'

interface CnrAutoFillProps {
  onFill: (caseDetails: Record<string, any>) => void
}

export function CnrAutoFill({ onFill }: CnrAutoFillProps) {
  const [cnr, setCnr] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFetch = async () => {
    if (!cnr.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/courts/fetch-by-cnr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnr: cnr.trim() }),
      })
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      onFill(data)
      toast.success('Case details auto-filled from eCourts!')
    } catch {
      toast.error('Could not fetch case from eCourts. Please enter manually.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-4">
      <p className="text-sm font-medium text-indigo-800 mb-2 flex items-center gap-1">
        <Sparkles size={14} />
        Have a CNR number? Auto-fill from eCourts
      </p>
      <div className="flex gap-2">
        <Input
          value={cnr}
          onChange={(e) => setCnr(e.target.value)}
          placeholder="Enter CNR number (e.g. TGHC010...)"
          className="font-mono bg-white"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleFetch())}
        />
        <Button
          type="button"
          onClick={handleFetch}
          disabled={loading || !cnr.trim()}
          variant="secondary"
        >
          {loading ? 'Fetching…' : 'Auto-fill'}
        </Button>
      </div>
    </div>
  )
}
```

---

## Step 7: API Route (`app/api/cases/route.ts`)

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { caseSchema } from '@/lib/validations/case'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId

  const body = await request.json()
  const parsed = caseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { clientIds, ...caseData } = parsed.data

  const newCase = await prisma.case.create({
    data: {
      ...caseData,
      profileId: userId,
      createdBy: userId,
      filingDate: caseData.filingDate ? new Date(caseData.filingDate) : null,
      previousDate: caseData.previousDate ? new Date(caseData.previousDate) : null,
      nextDate: caseData.nextDate ? new Date(caseData.nextDate) : null,
      // Link clients in the same transaction
      clients: clientIds?.length ? {
        create: clientIds.map(clientId => ({ clientId }))
      } : undefined,
    }
  })

  return NextResponse.json(newCase, { status: 201 })
}
```

---

## Verification Checklist
- [ ] Court type selector highlights selected type
- [ ] CNR auto-fill fetches and populates all form fields
- [ ] All form fields validate with Zod before submission
- [ ] Client link modal searches and adds clients by name
- [ ] Status radio (running/decided/abandoned) works
- [ ] Important checkbox toggles correctly
- [ ] Date fields accept valid dates only
- [ ] Form submits to POST `/api/cases` on create
- [ ] Form submits to PATCH `/api/cases/[id]` on edit
- [ ] Success redirects to case detail page
- [ ] Error shows toast with message
- [ ] Mobile: all fields stack to single column
