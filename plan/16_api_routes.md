# Stage 16: All API Routes

## Overview
Complete list of all Next.js API route handlers with request/response contracts, authentication requirements, and Prisma queries.

---

## Authentication Pattern (All Routes)

Every API route must start with:

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// In each handler:
const session = await auth()
if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const userId = session.userId
```

---

## 1. Profile Routes

### `GET /api/profile`
```typescript
// Returns current user's profile
// Response: Profile object
const profile = await prisma.profile.findUnique({ where: { id: userId } })
return NextResponse.json(profile)
```

### `PATCH /api/profile`
```typescript
// Updates profile fields
// Body: Partial<Profile> (whitelist allowed fields)
const ALLOWED = ['fullName', 'officeName', 'officeAddress', 'mobile',
                 'logoUrl', 'qrCodeUrl', 'bankName', 'bankAccountName',
                 'bankIfsc', 'bankAccountNo', 'upiId']
const data = Object.fromEntries(
  Object.entries(body).filter(([key]) => ALLOWED.includes(key))
)
const profile = await prisma.profile.update({ where: { id: userId }, data })
return NextResponse.json(profile)
```

---

## 2. Cases Routes

### `GET /api/cases`
```typescript
// List cases with pagination and filters
// Query params: status, search, courtType, fixedFor, page, limit
// Returns: { cases: CaseListItem[], total: number }
```

### `POST /api/cases`
```typescript
// Create new case
// Body: CaseFormValues (validated with caseSchema)
// Returns: { id: string, ...case }
// Steps:
//   1. Validate body with caseSchema
//   2. Check plan limits (free: max 50 cases)
//   3. prisma.case.create({ data: { ...data, profileId: userId, createdBy: userId } })
//   4. If clientIds provided: create CaseClient records
```

### `GET /api/cases/[id]`
```typescript
// Get case by id with all relations
// Verify: case.profileId === userId (or team member with canViewCase)
```

### `PATCH /api/cases/[id]`
```typescript
// Update case
// Body: Partial<Case>
// Verify ownership
// Handle clientIds: delete existing CaseClient records, create new ones
```

### `DELETE /api/cases/[id]`
```typescript
// Delete case (cascades to all related records via Prisma)
// Verify ownership
// Also delete files from Supabase Storage
const documents = await prisma.caseDocument.findMany({ where: { caseId: params.id } })
const supabase = createClient()
for (const doc of documents) {
  await supabase.storage.from('case-documents').remove([doc.fileUrl])
}
await prisma.case.delete({ where: { id: params.id } })
```

### `GET /api/cases/search`
```typescript
// Quick search for case linking in task/reminder forms
// Query: q (string, min 2 chars)
// Returns: [{ id, caseNumber, firstParty, oppositeParty }] max 10
const cases = await prisma.case.findMany({
  where: {
    profileId: userId,
    OR: [
      { caseNumber: { contains: q, mode: 'insensitive' } },
      { firstParty: { contains: q, mode: 'insensitive' } },
      { cnrNumber: { contains: q, mode: 'insensitive' } },
    ]
  },
  select: { id: true, caseNumber: true, firstParty: true, oppositeParty: true },
  take: 10,
})
```

---

## 3. Case Sub-Resource Routes

### `POST /api/cases/[id]/notes`
```typescript
// Body: { noteDate?, purpose?, noteText: string }
await prisma.caseNote.create({
  data: { caseId: params.id, profileId: userId, addedBy: userId, ...body }
})
```

### `DELETE /api/cases/[id]/notes/[noteId]`
```typescript
// Delete note (verify caseNote.profileId === userId)
await prisma.caseNote.delete({ where: { id: params.noteId } })
```

### `POST /api/cases/[id]/documents`
```typescript
// Save document metadata after Supabase Storage upload
// Body: { fileName, fileUrl, fileSize, fileType }
await prisma.caseDocument.create({
  data: { caseId: params.id, profileId: userId, uploadedBy: userId, ...body }
})
```

### `DELETE /api/cases/[id]/documents/[docId]`
```typescript
// Delete document metadata + remove from Supabase Storage
const doc = await prisma.caseDocument.findUnique({ where: { id: params.docId } })
const supabase = createClient()
await supabase.storage.from('case-documents').remove([doc.fileUrl])
await prisma.caseDocument.delete({ where: { id: params.docId } })
```

### `GET /api/documents/[docId]/download`
```typescript
// Generate signed URL for document download
const doc = await prisma.caseDocument.findUnique({ where: { id: params.docId } })
const supabase = createClient()
const { data } = await supabase.storage.from('case-documents').createSignedUrl(doc.fileUrl, 3600)
return NextResponse.redirect(data.signedUrl)
```

### `POST /api/cases/[id]/fees`
```typescript
// Add fee record
// Body: { clientId?, paymentMode, amount, description, feeDate, isExpense }
await prisma.fee.create({
  data: { caseId: params.id, profileId: userId, ...body }
})
```

### `DELETE /api/cases/[id]/fees/[feeId]`
```typescript
await prisma.fee.delete({ where: { id: params.feeId } })
```

### `POST /api/cases/[id]/orders`
```typescript
// Add court order
// Body: { orderType, orderDate, orderUrl, description }
await prisma.caseOrder.create({ data: { caseId: params.id, ...body } })
```

### `POST /api/cases/[id]/opposite-counsel`
```typescript
// Add opposite counsel
// Body: { fullName, mobile, email, address }
await prisma.opposeCounsel.create({ data: { caseId: params.id, ...body } })
```

### `PATCH /api/cases/[id]/opposite-counsel/[counselId]`
```typescript
await prisma.opposeCounsel.update({ where: { id: params.counselId }, data: body })
```

### `DELETE /api/cases/[id]/opposite-counsel/[counselId]`
```typescript
await prisma.opposeCounsel.delete({ where: { id: params.counselId } })
```

### `POST /api/cases/[id]/linked-cases`
```typescript
// Link two cases together
// Body: { linkedCaseId: string }
// Creates bidirectional link
await prisma.linkedCase.createMany({
  data: [
    { caseId: params.id, linkedCaseId: body.linkedCaseId },
    { caseId: body.linkedCaseId, linkedCaseId: params.id },
  ],
  skipDuplicates: true,
})
```

---

## 4. Clients Routes

### `GET /api/clients`
```typescript
// List clients with pagination + search
// Query: search, page, limit
```

### `POST /api/clients`
```typescript
// Create client
// Check plan limit (free: max 20 clients)
// Body: { fullName, email?, mobile?, address?, dpdpConsent }
await prisma.client.create({ data: { ...body, profileId: userId } })
```

### `GET /api/clients/[id]`
### `PATCH /api/clients/[id]`
### `DELETE /api/clients/[id]`

```typescript
// DELETE: check if client has linked cases first
const caseCount = await prisma.caseClient.count({ where: { clientId: params.id } })
if (caseCount > 0) return NextResponse.json({ error: 'Client has linked cases' }, { status: 409 })
```

### `GET /api/clients/search`
```typescript
// Quick search for client linking
// Query: q
// Returns: [{ id, fullName, mobile, email }] max 10
```

---

## 5. Tasks Routes

### `GET /api/tasks`
```typescript
// List tasks (optionally filtered by status)
```

### `POST /api/tasks`
```typescript
// Create task
// Body: { title, description?, priority, status, dueDate?, assignedTo?, caseId?, clientId? }
```

### `PATCH /api/tasks/[id]`
```typescript
// Update task (status, title, etc.)
```

### `DELETE /api/tasks/[id]`

---

## 6. Reminders Routes

### `GET /api/reminders`
### `POST /api/reminders`
### `PATCH /api/reminders/[id]`
### `DELETE /api/reminders/[id]`

---

## 7. Team Routes

### `GET /api/team`
### `POST /api/team`
```typescript
// Create team member + send invite email
// Check plan limit (free: 0 team members)
// Send email via Resend with invite link
```

### `PATCH /api/team/[id]`
### `DELETE /api/team/[id]`

---

## 8. Fields Routes

### `GET /api/fields?fieldType=casetype`
### `POST /api/fields`
### `PATCH /api/fields/[id]`
### `DELETE /api/fields/[id]`

### `POST /api/fields/reorder`
```typescript
// Body: { fieldType: string, orderedIds: string[] }
// Update sortOrder for each field
const updates = orderedIds.map((id, index) =>
  prisma.customField.update({
    where: { id, profileId: userId },
    data: { sortOrder: index }
  })
)
await prisma.$transaction(updates)
```

---

## 9. Color Codes Routes

### `GET /api/color-codes`
### `POST /api/color-codes`
```typescript
// Upsert: update if label already exists
await prisma.colorCode.upsert({
  where: { profileId_label: { profileId: userId, label: body.label } },
  create: { ...body, profileId: userId },
  update: { color: body.color },
})
```

### `DELETE /api/color-codes/[id]`

---

## 10. Court Routes

### `GET /api/courts/states`
```typescript
// Returns static list of Indian states with state codes
// This can be a static JSON import — no DB query needed
import states from '@/data/states.json'
return NextResponse.json(states)
```

### `GET /api/courts/districts?state_id=TG`
```typescript
// Calls eCourts API or returns from static data
// See plan/17_ecourts_integration.md
```

### `GET /api/courts/complexes?state_id=TG&district_id=12`
```typescript
// Calls eCourts API for court complexes
```

### `POST /api/courts/sync`
```typescript
// Trigger manual sync for a registered court
// Body: { court_id: string }
// Sets syncStatus = 'syncing'
// Calls eCourts API for advocate's cases
// Updates each case's nextDate, fixedFor, courtNo, previousDate
// Sets syncStatus = 'done', lastSyncedAt = now()
// See plan/17_ecourts_integration.md for full sync logic
```

### `POST /api/courts/fetch-by-cnr`
```typescript
// Body: { cnr: string, caseId?: string }
// Calls eCourts CNR lookup API
// Returns case details for auto-fill in form
// If caseId provided: also updates the existing case + history records
```

### `GET /api/courts/causelist?state=TG&district=12&establishment=...&date=...&case_type=...`
```typescript
// Proxy eCourts cause list API
// Returns cause list data for display
```

### `GET /api/courts/registered`
### `POST /api/courts/registered`
### `DELETE /api/courts/registered/[id]`

---

## 11. Export Routes

### `GET /api/export/daily-board?date=YYYY-MM-DD`
```typescript
// Generate PDF of all cases for the given date
// Groups by court
// Uses @react-pdf/renderer
// See plan/18_exports.md
```

### `GET /api/export/cases-pdf?<filters>`
### `GET /api/export/cases-excel?<filters>`
### `GET /api/export/invoice?fee_id=...`
### `GET /api/export/ledger?case_id=...`

---

## 12. Notification Routes

### `POST /api/notify/email`
```typescript
// Send email to one or more recipients
// Body: { to: string[], subject: string, html: string }
const resend = new Resend(process.env.RESEND_API_KEY)
await resend.emails.send({
  from: 'Advocase <notifications@advocase.app>',
  to: body.to,
  subject: body.subject,
  html: body.html,
})
```

### `POST /api/notify/clients-bulk`
(see plan/13_search.md)

---

## 13. Search Route

### `GET /api/search/cases`
(see plan/13_search.md)

---

## 14. Cron Route

### `POST /api/sync/cron`
```typescript
// Called by Vercel Cron / Supabase pg_cron every 3 hours
// Verify: request.headers.get('x-cron-secret') === process.env.CRON_SECRET
// 1. Find all registered courts with lastSyncedAt > 3 hours ago (or never)
// 2. For each court: call eCourts API, sync cases
// 3. Check reminders: send emails for due reminders
// See plan/17_ecourts_integration.md and plan/20_deployment.md
```

---

## Error Handling Pattern

All API routes should use this consistent error pattern:

```typescript
try {
  // ... handler code
} catch (error) {
  console.error('[API Error]', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

## Response Format Conventions

- Success: `200` or `201` (create) with JSON body
- Not found: `404` with `{ error: 'Not found' }`
- Unauthorized: `401` with `{ error: 'Unauthorized' }`
- Forbidden: `403` with `{ error: 'Forbidden' }`
- Validation error: `400` with `{ error: zodError.flatten() }`
- Conflict: `409` with `{ error: 'descriptive message' }`
- Rate limit: `429` with `{ error: 'Too many requests' }`
- Plan limit: `402` with `{ error: 'Plan limit reached', limit: N, current: M }`

---

## Verification Checklist
- [ ] All routes return 401 for unauthenticated requests
- [ ] All routes verify resource belongs to current user before returning
- [ ] All POST routes validate body with Zod
- [ ] Plan limits are enforced on create operations
- [ ] Error responses are consistent JSON format
- [ ] Cron route verifies secret before running
- [ ] Document signed URLs expire after 1 hour
