# Stage 9: Clients Pages

## Goal
Build `/clients` (list with cards) and `/clients/[id]` (detail with cases, fee history, messaging).

---

## Files to Create
- `app/(dashboard)/clients/page.tsx`
- `app/(dashboard)/clients/[id]/page.tsx`
- `components/clients/ClientCard.tsx`
- `components/clients/ClientForm.tsx`
- `app/api/clients/route.ts`
- `app/api/clients/[id]/route.ts`

---

## Step 1: Clients List Page (`app/(dashboard)/clients/page.tsx`)

Server Component.

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ClientsPageClient } from '@/components/clients/ClientsPageClient'

interface ClientsPageProps {
  searchParams: { search?: string; page?: string; new?: string }
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.userId

  const profileId = userId
  const page = Number(searchParams.page ?? 1)
  const limit = 24
  const skip = (page - 1) * limit

  const where = {
    profileId,
    ...(searchParams.search && {
      OR: [
        { fullName: { contains: searchParams.search, mode: 'insensitive' as const } },
        { mobile: { contains: searchParams.search } },
        { email: { contains: searchParams.search, mode: 'insensitive' as const } },
      ]
    })
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        _count: { select: { cases: true, fees: true } },
        // Get running case count
        cases: {
          where: { case: { status: 'running' } },
          select: { id: true }
        },
        fees: {
          where: { isExpense: false },
          select: { amount: true }
        }
      },
      orderBy: { fullName: 'asc' },
      skip,
      take: limit,
    }),
    prisma.client.count({ where })
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <ClientsPageClient
      clients={clients}
      total={total}
      totalPages={totalPages}
      currentPage={page}
      searchParams={searchParams}
      showNewForm={searchParams.new === '1'}
    />
  )
}
```

---

## Step 2: Clients Page Client (`components/clients/ClientsPageClient.tsx`)

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientCard } from './ClientCard'
import { ClientForm } from './ClientForm'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { EmptyState } from '@/components/shared/EmptyState'
import { Users } from 'lucide-react'

export function ClientsPageClient({ clients, total, totalPages, currentPage, searchParams, showNewForm }) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(showNewForm)
  const [search, setSearch] = useState(searchParams.search ?? '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/clients?search=${encodeURIComponent(search)}`)
  }

  const handleClientAdded = () => {
    setFormOpen(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500">{total} clients</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open('/api/export/clients-excel', '_blank')}>
            <Download size={14} className="mr-1" /> Export
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus size={16} className="mr-1" /> Add Client
          </Button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, mobile, email…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">Search</Button>
      </form>

      {/* Client grid */}
      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients found"
          description="Add your first client to link them to cases."
          action={{ label: 'Add Client', onClick: () => setFormOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => <ClientCard key={client.id} client={client} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={currentPage === 1}
            onClick={() => router.push(`/clients?page=${currentPage - 1}`)}>Previous</Button>
          <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={currentPage === totalPages}
            onClick={() => router.push(`/clients?page=${currentPage + 1}`)}>Next</Button>
        </div>
      )}

      {/* Add client sheet */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add Client</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <ClientForm onSuccess={handleClientAdded} onCancel={() => setFormOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

---

## Step 3: Client Card (`components/clients/ClientCard.tsx`)

```typescript
'use client'
import Link from 'next/link'
import { Phone, Mail, Briefcase, Receipt } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, formatCurrency } from '@/lib/utils'

interface ClientCardProps {
  client: {
    id: string
    fullName: string
    email: string | null
    mobile: string | null
    cases: { id: string }[]         // running cases
    fees: { amount: any }[]         // payments received
  }
}

export function ClientCard({ client }: ClientCardProps) {
  const totalFees = client.fees.reduce((sum, f) => sum + Number(f.amount), 0)
  const runningCases = client.cases.length

  return (
    <Link
      href={`/clients/${client.id}`}
      className="block bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-medium">
            {getInitials(client.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 truncate">{client.fullName}</h3>
          {client.mobile && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Phone size={11} /> {client.mobile}
            </p>
          )}
          {client.email && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
              <Mail size={11} /> {client.email}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Briefcase size={12} />
          {runningCases} running {runningCases === 1 ? 'case' : 'cases'}
        </span>
        {totalFees > 0 && (
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <Receipt size={12} />
            {formatCurrency(totalFees)}
          </span>
        )}
      </div>
    </Link>
  )
}
```

---

## Step 4: Client Form (`components/clients/ClientForm.tsx`)

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

const clientSchema = z.object({
  fullName:     z.string().min(2, 'Name is required'),
  email:        z.string().email('Invalid email').optional().or(z.literal('')),
  mobile:       z.string().optional(),
  address:      z.string().optional(),
  dpdpConsent:  z.boolean().default(false),
})

type ClientValues = z.infer<typeof clientSchema>

interface ClientFormProps {
  defaultValues?: Partial<ClientValues> & { id?: string }
  onSuccess: (client: any) => void
  onCancel: () => void
}

export function ClientForm({ defaultValues, onSuccess, onCancel }: ClientFormProps) {
  const [saving, setSaving] = useState(false)
  const isEdit = !!defaultValues?.id

  const { register, handleSubmit, control, formState: { errors } } = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: defaultValues ?? { dpdpConsent: false },
  })

  const onSubmit = async (values: ClientValues) => {
    setSaving(true)
    try {
      const url = isEdit ? `/api/clients/${defaultValues.id}` : '/api/clients'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      toast.success(isEdit ? 'Client updated' : 'Client added')
      onSuccess(data)
    } catch {
      toast.error('Failed to save client')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Full Name *</Label>
        <Input {...register('fullName')} placeholder="e.g. Ravi Kumar" />
        {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
      </div>
      <div>
        <Label>Mobile</Label>
        <Input {...register('mobile')} placeholder="10-digit mobile number" />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" {...register('email')} placeholder="client@email.com" />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <Label>Address</Label>
        <Textarea {...register('address')} rows={2} placeholder="Client address" />
      </div>
      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="dpdpConsent"
          render={({ field }) => (
            <Checkbox checked={field.value} onCheckedChange={field.onChange} id="dpdp" />
          )}
        />
        <label htmlFor="dpdp" className="text-xs text-slate-600 cursor-pointer">
          Client has given DPDP consent to store their data
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Saving…' : isEdit ? 'Update Client' : 'Add Client'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
```

---

## Step 5: Client Detail Page (`app/(dashboard)/clients/[id]/page.tsx`)

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { ClientDetailClient } from '@/components/clients/ClientDetailClient'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.userId

  const client = await prisma.client.findUnique({
    where: { id: params.id, profileId: userId },
    include: {
      cases: {
        include: {
          case: {
            select: {
              id: true, caseNumber: true, firstParty: true, oppositeParty: true,
              courtName: true, nextDate: true, fixedFor: true, status: true, caseType: true
            }
          }
        },
        orderBy: { case: { nextDate: 'asc' } }
      },
      fees: {
        include: { case: { select: { id: true, caseNumber: true } } },
        orderBy: { feeDate: 'desc' }
      }
    }
  })

  if (!client) notFound()

  return <ClientDetailClient client={client} />
}
```

### `components/clients/ClientDetailClient.tsx`

```typescript
// Client detail with tabs:
// Tab 1 "Cases" — sub-tabs: Running | Decided & Abandoned
//   Each case shows as a CaseCard variant (compact)
// Tab 2 "Fee History" — table of all payments across all linked cases
//   Columns: Date, Case, Description, Mode, Amount
//   Total at bottom
// Tab 3 "Message" — compose area
//   Email input (pre-filled with client email)
//   Subject, Message body
//   Send button → calls /api/notify/email

// Header:
//   Avatar, full name, mobile, email
//   Edit button → opens ClientForm sheet
//   "Add to Case" button → search modal to link this client to a case

// Fee total across all cases shown in header as a badge
```

---

## API Routes

### `app/api/clients/route.ts`
```typescript
// GET: list clients for current user (with pagination + search)
// POST: create new client
//   Validates with clientSchema
//   prisma.client.create({ data: { ...body, profileId: userId } })
```

### `app/api/clients/[id]/route.ts`
```typescript
// GET: get client by id (verify profileId = userId)
// PATCH: update client
// DELETE: delete client (only if no linked cases, else return 409)
```

---

## Verification Checklist
- [ ] Client card shows name, mobile, email, case count, total fees
- [ ] Client list is searchable by name/mobile/email
- [ ] Add client sheet opens with clean form
- [ ] DPDP consent checkbox is included
- [ ] Client detail page shows Cases tab with running/decided sub-tabs
- [ ] Fee history tab shows all fees across all linked cases
- [ ] Edit client sheet works and updates profile
- [ ] Message tab shows email composer
- [ ] Client deletion blocked if linked to cases
- [ ] Mobile: cards stack to 1 column
