# Stage 17: eCourts Integration

## Goal
Implement the eCourts API integration for: CNR lookup (auto-fill), advocate case list sync (registered courts), and cause list browsing.

---

## eCourts API Overview

eCourts provides public APIs for Indian courts at `https://services.ecourts.gov.in/ecourtindiaServices/`.

Key endpoints used:
1. `POST /fetchCaseViaCNR` — fetch case by CNR number
2. `POST /fetchCasesViaAdvocate` — fetch all cases for an advocate barcode
3. `GET /fetchCauseList` — get daily cause list
4. State/District/Complex data — mostly static JSON

**Important Notes:**
- eCourts API has no authentication — it's public
- The API has rate limits — implement delays between requests
- API responses may change — parse defensively
- Some courts may be offline or slow — handle timeouts (10s max)
- Always use server-side API routes as proxies (never call from browser — CORS issues)

---

## Step 1: Static Data Files

Create `data/ecourts-states.json`:

```json
[
  { "state_id": "1", "state_code": "TG", "state_name": "Telangana" },
  { "state_id": "2", "state_code": "AP", "state_name": "Andhra Pradesh" },
  { "state_id": "3", "state_code": "KA", "state_name": "Karnataka" },
  { "state_id": "4", "state_code": "MH", "state_name": "Maharashtra" },
  { "state_id": "5", "state_code": "DL", "state_name": "Delhi" },
  { "state_id": "6", "state_code": "TN", "state_name": "Tamil Nadu" }
  // ... all 28 states + UTs
]
```

> Full list can be scraped once from eCourts and saved as static JSON.

---

## Step 2: District Court API (`lib/ecourts/district.ts`)

```typescript
const ECOURTS_BASE = 'https://services.ecourts.gov.in/ecourtindiaServices'
const TIMEOUT_MS = 10000

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// ─────────────────────────────────────────────
// 1. Get Districts for a State
// ─────────────────────────────────────────────
export async function getDistricts(stateCode: string): Promise<District[]> {
  try {
    const res = await fetchWithTimeout(
      `${ECOURTS_BASE}/getDistrict?state_code=${stateCode}`
    )
    if (!res.ok) return []
    const data = await res.json()
    // Response format: { district: [{ dist_code: "1", district_name: "Hyderabad" }] }
    return (data.district ?? []).map((d: any) => ({
      id: d.dist_code,
      name: d.district_name,
    }))
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────
// 2. Get Court Complexes for a District
// ─────────────────────────────────────────────
export async function getComplexes(stateCode: string, districtCode: string): Promise<Complex[]> {
  try {
    const res = await fetchWithTimeout(
      `${ECOURTS_BASE}/getCourts?state_code=${stateCode}&dist_code=${districtCode}`
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.courts ?? []).map((c: any) => ({
      id: c.court_code,
      name: c.court_name,
      establishment: c.establishment_code,
    }))
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────
// 3. Fetch Case by CNR Number
// ─────────────────────────────────────────────
export async function fetchCaseByCNR(cnr: string): Promise<ECourtsCaseDetail | null> {
  try {
    const res = await fetchWithTimeout(`${ECOURTS_BASE}/fetchCaseViaCNR`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ cnr_number: cnr }).toString(),
    })
    if (!res.ok) return null

    const data = await res.json()
    if (!data || data.errorMsg) return null

    // Parse and normalize the response
    return parseCNRResponse(data)
  } catch {
    return null
  }
}

function parseCNRResponse(data: any): ECourtsCaseDetail {
  // eCourts response structure (may vary by court):
  // {
  //   case_details: { case_type, reg_number, reg_year, date_of_registration, date_of_decision },
  //   petitioner_details: { petitioner: "Name1\nName2" },
  //   respondent_details: { respondent: "Name1\nName2" },
  //   case_status: { judge_name, court_name, court_number, stage_of_case, next_hearing_date },
  //   history_of_cases: [{ judge, business_on_date, hearing_date, purpose_of_hearing }],
  //   acts: [{ act_name, sections }]
  // }

  const caseDetails = data.case_details ?? {}
  const status = data.case_status ?? {}
  const petitioner = data.petitioner_details?.petitioner ?? ''
  const respondent = data.respondent_details?.respondent ?? ''
  const history = data.history_of_cases ?? []

  return {
    caseNumber: `${caseDetails.case_type} ${caseDetails.reg_number}/${caseDetails.reg_year}`,
    year: parseInt(caseDetails.reg_year),
    courtName: status.court_name,
    courtNo: status.court_number,
    judgeName: status.judge_name,
    firstParty: petitioner.split('\n')[0]?.trim(),
    oppositeParty: respondent.split('\n')[0]?.trim(),
    nextDate: parseECourtsDate(status.next_hearing_date),
    fixedFor: status.stage_of_case,
    previousDate: history[0] ? parseECourtsDate(history[0].hearing_date) : null,
    filingDate: parseECourtsDate(caseDetails.date_of_registration),
    history: history.map((h: any) => ({
      judge: h.judge,
      businessOnDate: parseECourtsDate(h.business_on_date),
      hearingDate: parseECourtsDate(h.hearing_date),
      purpose: h.purpose_of_hearing,
    })),
  }
}

function parseECourtsDate(dateStr: string | null): Date | null {
  if (!dateStr || dateStr === '-') return null
  // eCourts date format: DD-MM-YYYY or DD/MM/YYYY
  try {
    const [day, month, year] = dateStr.replace(/\//g, '-').split('-')
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────
// 4. Fetch Advocate Cases (for court sync)
// ─────────────────────────────────────────────
export async function fetchAdvocateCases(params: {
  stateCode: string
  districtCode?: string
  complexCode?: string
  establishmentCode?: string
  advocateName: string
  barCode?: string
  year?: string
}): Promise<ECourtsCaseListItem[]> {
  try {
    const res = await fetchWithTimeout(`${ECOURTS_BASE}/fetchCasesViaAdvocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        state_code: params.stateCode,
        dist_code: params.districtCode ?? '',
        court_complex_code: params.complexCode ?? '',
        est_code: params.establishmentCode ?? '',
        advocate_name: params.advocateName,
        reg_year: params.year ?? new Date().getFullYear().toString(),
      }).toString(),
    })

    if (!res.ok) return []
    const data = await res.json()
    if (!data || data.errorMsg) return []

    // Response: { data: [{ cnr_number, case_type, reg_number, ... }] }
    return (data.data ?? []).map((c: any) => ({
      cnrNumber: c.cnr_number,
      caseNumber: `${c.case_type} ${c.reg_number}/${c.reg_year}`,
      firstParty: c.petitioner,
      oppositeParty: c.respondent,
      nextDate: parseECourtsDate(c.next_hearing_date),
      fixedFor: c.stage_of_case,
      courtName: c.court_name,
      courtNo: c.court_no,
      judgeName: c.judge_name,
    }))
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────
// 5. Fetch Cause List
// ─────────────────────────────────────────────
export async function fetchCauseList(params: {
  stateCode: string
  districtCode: string
  complexCode: string
  establishmentCode: string
  date: string   // YYYY-MM-DD
  caseType?: string
}): Promise<CauseListEntry[]> {
  try {
    const formattedDate = params.date.split('-').reverse().join('-') // DD-MM-YYYY

    const res = await fetchWithTimeout(`${ECOURTS_BASE}/getCauseList`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        state_code: params.stateCode,
        dist_code: params.districtCode,
        court_complex_code: params.complexCode,
        est_code: params.establishmentCode,
        date: formattedDate,
        case_type_1: params.caseType ?? '',
      }).toString(),
    })

    if (!res.ok) return []
    const data = await res.json()
    return (data.causeList ?? []).map((entry: any) => ({
      serialNo: entry.srno,
      caseNumber: entry.case_no,
      petitioner: entry.petitioner_name,
      respondent: entry.respondent_name,
      advocate: entry.adv_name,
      purpose: entry.purpose,
      courtNo: entry.court_no,
    }))
  } catch {
    return []
  }
}
```

---

## Step 3: Court Sync Logic (`app/api/courts/sync/route.ts`)

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { fetchAdvocateCases } from '@/lib/ecourts/district'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId

  const { court_id } = await request.json()

  // Get registered court
  const court = await prisma.courtRegistered.findUnique({
    where: { id: court_id, profileId: userId }
  })
  if (!court) return NextResponse.json({ error: 'Court not found' }, { status: 404 })

  // Mark as syncing
  await prisma.courtRegistered.update({
    where: { id: court_id },
    data: { syncStatus: 'syncing' }
  })

  try {
    // Fetch cases from eCourts
    const eCourtsCase = await fetchAdvocateCases({
      stateCode: court.stateCode ?? '',
      advocateName: court.advocateName ?? '',
      barCode: court.barCode ?? undefined,
      year: court.year ?? undefined,
    })

    // Update each case in our DB that matches CNR
    let updatedCount = 0
    for (const ec of eCourtsCase) {
      if (!ec.cnrNumber) continue

      const existing = await prisma.case.findFirst({
        where: { profileId: userId, cnrNumber: ec.cnrNumber }
      })

      if (existing) {
        await prisma.case.update({
          where: { id: existing.id },
          data: {
            nextDate: ec.nextDate,
            fixedFor: ec.fixedFor,
            previousDate: ec.nextDate ? existing.nextDate : existing.previousDate,
            courtNo: ec.courtNo ?? existing.courtNo,
            judgeName: ec.judgeName ?? existing.judgeName,
            lastSyncedAt: new Date(),
            ecourtsData: ec as any,
          }
        })
        updatedCount++
      }
    }

    // Mark sync complete
    await prisma.courtRegistered.update({
      where: { id: court_id },
      data: {
        syncStatus: 'done',
        lastSyncedAt: new Date(),
      }
    })

    return NextResponse.json({ success: true, updated: updatedCount })
  } catch (error) {
    await prisma.courtRegistered.update({
      where: { id: court_id },
      data: { syncStatus: 'error' }
    })
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
```

---

## Step 4: CNR Lookup Route (`app/api/courts/fetch-by-cnr/route.ts`)

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { fetchCaseByCNR } from '@/lib/ecourts/district'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId

  const { cnr, caseId } = await request.json()
  if (!cnr) return NextResponse.json({ error: 'CNR required' }, { status: 400 })

  const caseData = await fetchCaseByCNR(cnr.trim().toUpperCase())
  if (!caseData) {
    return NextResponse.json({ error: 'Case not found on eCourts' }, { status: 404 })
  }

  // If caseId provided, also update existing case history
  if (caseId) {
    const existing = await prisma.case.findFirst({
      where: { id: caseId, profileId: userId }
    })

    if (existing && caseData.history?.length) {
      // Upsert history records
      for (const h of caseData.history) {
        await prisma.caseHistory.upsert({
          where: { id: `${caseId}-${h.hearingDate?.toISOString()}` },
          create: {
            caseId,
            judge: h.judge,
            businessOnDate: h.businessOnDate,
            hearingDate: h.hearingDate,
            purpose: h.purpose,
          },
          update: {
            judge: h.judge,
            purpose: h.purpose,
          },
        })
      }

      // Update case dates
      await prisma.case.update({
        where: { id: caseId },
        data: {
          nextDate: caseData.nextDate,
          fixedFor: caseData.fixedFor,
          previousDate: caseData.previousDate,
          judgeName: caseData.judgeName ?? existing.judgeName,
          lastSyncedAt: new Date(),
        }
      })
    }
  }

  // Return case data for form auto-fill
  return NextResponse.json({
    caseNumber: caseData.caseNumber,
    cnrNumber: cnr,
    year: caseData.year,
    courtName: caseData.courtName,
    courtNo: caseData.courtNo,
    judgeName: caseData.judgeName,
    firstParty: caseData.firstParty,
    oppositeParty: caseData.oppositeParty,
    nextDate: caseData.nextDate?.toISOString().split('T')[0],
    fixedFor: caseData.fixedFor,
    previousDate: caseData.previousDate?.toISOString().split('T')[0],
    filingDate: caseData.filingDate?.toISOString().split('T')[0],
  })
}
```

---

## Step 5: Cause List Route (`app/api/courts/causelist/route.ts`)

```typescript
import { fetchCauseList } from '@/lib/ecourts/district'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state') ?? ''
  const district = searchParams.get('district') ?? ''
  const establishment = searchParams.get('establishment') ?? ''
  const complex = searchParams.get('complex') ?? ''
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  const caseType = searchParams.get('case_type') ?? ''

  const causeList = await fetchCauseList({
    stateCode: state,
    districtCode: district,
    complexCode: complex,
    establishmentCode: establishment,
    date,
    caseType,
  })

  return NextResponse.json({ causeList, total: causeList.length })
}
```

---

## TypeScript Types for eCourts (`lib/ecourts/types.ts`)

```typescript
export interface ECourtsCaseDetail {
  caseNumber: string | null
  year: number | null
  courtName: string | null
  courtNo: string | null
  judgeName: string | null
  firstParty: string | null
  oppositeParty: string | null
  nextDate: Date | null
  fixedFor: string | null
  previousDate: Date | null
  filingDate: Date | null
  history: ECourtsCaseHistory[]
}

export interface ECourtsCaseHistory {
  judge: string | null
  businessOnDate: Date | null
  hearingDate: Date | null
  purpose: string | null
}

export interface ECourtsCaseListItem {
  cnrNumber: string | null
  caseNumber: string | null
  firstParty: string | null
  oppositeParty: string | null
  nextDate: Date | null
  fixedFor: string | null
  courtName: string | null
  courtNo: string | null
  judgeName: string | null
}

export interface CauseListEntry {
  serialNo: string
  caseNumber: string
  petitioner: string
  respondent: string
  advocate: string
  purpose: string
  courtNo: string
}

export interface District {
  id: string
  name: string
}

export interface Complex {
  id: string
  name: string
  establishment: string
}
```

---

## Cause List Page (`app/(dashboard)/causelist/page.tsx`)

```typescript
// Extra page: /causelist
// Client Component (all search is interactive)
// Step 1: Select State (dropdown from /api/courts/states)
// Step 2: Select District (dropdown from /api/courts/districts?state_id=...)
// Step 3: Select Court Complex + Establishment (from /api/courts/complexes?...)
// Step 4: Select Date (date picker)
// Step 5: Select Case Type (optional, text input)
// Step 6: "Get Cause List" button → calls /api/courts/causelist
// Results: clean table with Serial No, Case No, Parties, Advocate, Purpose, Court No
// Export to PDF button
```

---

## Verification Checklist
- [ ] CNR lookup returns correct case details
- [ ] CNR auto-fill populates all matching form fields
- [ ] Court sync updates case dates for matching CNR numbers
- [ ] Sync marks courts as 'syncing' then 'done' or 'error'
- [ ] District dropdown loads from eCourts API correctly
- [ ] Complex dropdown loads based on state + district selection
- [ ] Cause list page shows results in a table
- [ ] All API calls have proper timeout handling (10s)
- [ ] Errors are handled gracefully (eCourts can be unreliable)
- [ ] API calls are proxied through Next.js routes (not direct from browser)
