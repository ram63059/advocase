# Stage 18: PDF & Excel Exports

## Goal
Build all export functionality: Daily Board PDF, Invoice PDF, Fee Ledger PDF, Cases List PDF, Cases List Excel.

---

## Dependencies
```
@react-pdf/renderer — for all PDF generation
xlsx — for Excel export
```

---

## PDF Template Base Setup

Create `lib/pdf/styles.ts` for shared PDF styles:

```typescript
import { StyleSheet } from '@react-pdf/renderer'

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 30,
    color: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  officeName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1A1A2E',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
    color: '#1A1A2E',
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#4F46E5',
    textTransform: 'uppercase',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCell: {
    fontSize: 9,
    color: '#334155',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#94A3B8',
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
  }
})
```

---

## 1. Daily Board PDF (`lib/pdf/daily-board.tsx`)

```typescript
import React from 'react'
import {
  Document, Page, Text, View, Image, StyleSheet, Font
} from '@react-pdf/renderer'
import { format } from 'date-fns'
import { pdfStyles } from './styles'

interface DailyBoardCase {
  id: string
  caseNumber: string | null
  firstParty: string | null
  oppositeParty: string | null
  courtName: string | null
  courtNo: string | null
  fixedFor: string | null
  judgeName: string | null
  caseType: string | null
}

interface DailyBoardProps {
  date: Date
  cases: DailyBoardCase[]
  profile: {
    fullName: string | null
    officeName: string | null
    mobile: string | null
    logoUrl: string | null
  }
  groupBy?: 'court' | 'judge'
}

export function DailyBoardPDF({ date, cases, profile, groupBy = 'court' }: DailyBoardProps) {
  // Group cases by court name or judge
  const grouped = cases.reduce((acc, c) => {
    const key = groupBy === 'court'
      ? (c.courtName ?? 'Unknown Court')
      : (c.judgeName ?? 'Unknown Judge')
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {} as Record<string, DailyBoardCase[]>)

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <View>
            <Text style={pdfStyles.officeName}>{profile.officeName ?? profile.fullName ?? 'Advocate'}</Text>
            <Text style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>
              {profile.mobile ?? ''}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#4F46E5' }}>
              Daily Board
            </Text>
            <Text style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>
              {format(date, 'EEEE, dd MMMM yyyy')}
            </Text>
            <Text style={{ fontSize: 9, color: '#94A3B8', marginTop: 1 }}>
              {cases.length} {cases.length === 1 ? 'case' : 'cases'}
            </Text>
          </View>
        </View>

        {/* Cases grouped by court/judge */}
        {Object.entries(grouped).map(([groupName, groupCases]) => (
          <View key={groupName} style={{ marginBottom: 16 }}>
            {/* Group header */}
            <Text style={pdfStyles.sectionTitle}>{groupName}</Text>

            {/* Table */}
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableHeader}>
                <Text style={[pdfStyles.tableHeaderCell, { width: '8%' }]}>S.No</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '22%' }]}>Case No.</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '35%' }]}>Parties</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '20%' }]}>Fixed For</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: '15%' }]}>Type</Text>
              </View>

              {groupCases.map((c, i) => (
                <View key={c.id} style={[pdfStyles.tableRow, i % 2 === 0 ? {} : { backgroundColor: '#FAFAFA' }]}>
                  <Text style={[pdfStyles.tableCell, { width: '8%' }]}>{i + 1}</Text>
                  <Text style={[pdfStyles.tableCell, { width: '22%', fontFamily: 'Courier' }]}>
                    {c.caseNumber ?? '—'}
                  </Text>
                  <View style={{ width: '35%' }}>
                    <Text style={[pdfStyles.tableCell, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>
                      {truncateStr(c.firstParty ?? '—', 35)}
                    </Text>
                    <Text style={[pdfStyles.tableCell, { color: '#94A3B8', fontSize: 8 }]}>
                      vs {truncateStr(c.oppositeParty ?? '—', 35)}
                    </Text>
                  </View>
                  <Text style={[pdfStyles.tableCell, { width: '20%', color: '#4F46E5', fontSize: 8 }]}>
                    {c.fixedFor ?? '—'}
                  </Text>
                  <Text style={[pdfStyles.tableCell, { width: '15%', fontSize: 8 }]}>
                    {c.caseType ?? '—'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={pdfStyles.footer} fixed>
          <Text>Generated by Advocase • {format(new Date(), 'dd MMM yyyy HH:mm')}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

function truncateStr(str: string, n: number): string {
  return str.length > n ? str.substring(0, n - 1) + '…' : str
}
```

---

## 2. API Route: Daily Board (`app/api/export/daily-board/route.ts`)

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { DailyBoardPDF } from '@/lib/pdf/daily-board'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId

  const { searchParams } = new URL(request.url)
  const dateStr = searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  const groupBy = (searchParams.get('group_by') ?? 'court') as 'court' | 'judge'
  const date = new Date(dateStr)

  const [cases, profile] = await Promise.all([
    prisma.case.findMany({
      where: {
        profileId: userId,
        nextDate: { gte: startOfDay(date), lte: endOfDay(date) },
      },
      select: {
        id: true, caseNumber: true, firstParty: true, oppositeParty: true,
        courtName: true, courtNo: true, fixedFor: true, judgeName: true, caseType: true,
      },
      orderBy: [{ courtName: 'asc' }, { caseNumber: 'asc' }],
    }),
    prisma.profile.findUnique({
      where: { id: userId },
      select: { fullName: true, officeName: true, mobile: true, logoUrl: true }
    })
  ])

  const pdfBuffer = await renderToBuffer(
    <DailyBoardPDF
      date={date}
      cases={cases}
      profile={profile ?? { fullName: null, officeName: null, mobile: null, logoUrl: null }}
      groupBy={groupBy}
    />
  )

  const fileName = `daily-board-${dateStr}.pdf`
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}
```

---

## 3. Invoice PDF (`lib/pdf/invoice.tsx`)

```typescript
// Invoice for a specific fee record

interface InvoiceProps {
  fee: {
    id: string
    amount: number
    description: string | null
    feeDate: Date | null
    paymentMode: string | null
    invoiceGenerated: boolean
  }
  case: {
    caseNumber: string | null
    firstParty: string | null
    oppositeParty: string | null
    courtName: string | null
  }
  client: {
    fullName: string
    address: string | null
    mobile: string | null
  } | null
  profile: {
    fullName: string | null
    officeName: string | null
    officeAddress: string | null
    mobile: string | null
    logoUrl: string | null
    qrCodeUrl: string | null
    bankName: string | null
    bankAccountName: string | null
    bankIfsc: string | null
    bankAccountNo: string | null
    upiId: string | null
  }
}

export function InvoicePDF({ fee, case: c, client, profile }: InvoiceProps) {
  const invoiceNumber = `INV-${fee.id.slice(0, 8).toUpperCase()}`

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header: Logo + Office name */}
        <View style={pdfStyles.header}>
          <View>
            <Text style={pdfStyles.officeName}>{profile.officeName ?? profile.fullName}</Text>
            <Text style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>{profile.officeAddress}</Text>
            <Text style={{ fontSize: 9, color: '#64748B' }}>📱 {profile.mobile}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#4F46E5' }}>INVOICE</Text>
            <Text style={{ fontSize: 9, color: '#64748B', marginTop: 4 }}>{invoiceNumber}</Text>
            <Text style={{ fontSize: 9, color: '#64748B' }}>
              Date: {fee.feeDate ? format(fee.feeDate, 'dd MMM yyyy') : '—'}
            </Text>
          </View>
        </View>

        {/* Bill to + Case info */}
        <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, color: '#64748B', marginBottom: 4 }}>BILL TO</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11 }}>{client?.fullName ?? 'Client'}</Text>
            {client?.address && <Text style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>{client.address}</Text>}
            {client?.mobile && <Text style={{ fontSize: 9, color: '#64748B' }}>📱 {client.mobile}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, color: '#64748B', marginBottom: 4 }}>CASE REFERENCE</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11 }}>{c.caseNumber ?? '—'}</Text>
            <Text style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>
              {c.firstParty} vs {c.oppositeParty}
            </Text>
            <Text style={{ fontSize: 9, color: '#64748B' }}>{c.courtName}</Text>
          </View>
        </View>

        {/* Fee table */}
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderCell, { flex: 3 }]}>Description</Text>
            <Text style={[pdfStyles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Mode</Text>
            <Text style={[pdfStyles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Amount</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { flex: 3 }]}>{fee.description ?? 'Legal Services'}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: 'center' }]}>{fee.paymentMode ?? '—'}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>
              ₹{Number(fee.amount).toLocaleString('en-IN')}
            </Text>
          </View>
          {/* Total row */}
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1A1A2E', paddingTop: 8, paddingHorizontal: 8 }}>
            <Text style={{ flex: 3, fontFamily: 'Helvetica-Bold', fontSize: 11 }}>Total</Text>
            <Text style={{ flex: 1 }} />
            <Text style={{ flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 13, textAlign: 'right', color: '#4F46E5' }}>
              ₹{Number(fee.amount).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Payment info */}
        {(profile.bankName || profile.upiId) && (
          <View style={{ marginTop: 20, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 4 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 6 }}>Payment Details</Text>
            {profile.bankName && (
              <Text style={{ fontSize: 9, color: '#64748B' }}>
                Bank: {profile.bankName} | A/C: {profile.bankAccountNo} | IFSC: {profile.bankIfsc}
              </Text>
            )}
            {profile.upiId && (
              <Text style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>UPI: {profile.upiId}</Text>
            )}
            {profile.qrCodeUrl && (
              <Image src={profile.qrCodeUrl} style={{ width: 60, height: 60, marginTop: 6 }} />
            )}
          </View>
        )}

        <Text style={{ fontSize: 8, color: '#94A3B8', marginTop: 20, textAlign: 'center' }}>
          Thank you for your trust. This is a computer generated invoice.
        </Text>

        <View style={pdfStyles.footer} fixed>
          <Text>Advocase — Legal Case Management</Text>
          <Text>{invoiceNumber}</Text>
        </View>
      </Page>
    </Document>
  )
}
```

---

## 4. Cases List PDF (`app/api/export/cases-pdf/route.ts`)

```typescript
// GET /api/export/cases-pdf?filters...
// Same filter logic as /api/search/cases
// Generates a PDF table of matching cases
// Groups by court type
// Renders using @react-pdf/renderer

// PDF format:
// Header: Office name + "Cases List" + date range applied
// Table columns: S.No, Case No., CNR, First Party vs Opposite Party, Court, Next Date, Fixed For, Status
// Footer: total count + page numbers
```

---

## 5. Cases List Excel (`app/api/export/cases-excel/route.ts`)

```typescript
import * as XLSX from 'xlsx'

export async function GET(request: Request) {
  // ... auth check ...
  // ... fetch cases with same filter logic ...

  const data = cases.map((c, i) => ({
    'S.No': i + 1,
    'Case Number': c.caseNumber ?? '',
    'CNR': c.cnrNumber ?? '',
    'First Party': c.firstParty ?? '',
    'Opposite Party': c.oppositeParty ?? '',
    'Court': c.courtName ?? '',
    'Court Type': c.courtType ?? '',
    'Next Date': c.nextDate ? format(c.nextDate, 'dd/MM/yyyy') : 'Awaited',
    'Fixed For': c.fixedFor ?? '',
    'Status': c.status,
    'Case Type': c.caseType ?? '',
    'Year': c.year ?? '',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Cases')

  // Style header row
  ws['!cols'] = [
    { width: 5 }, { width: 20 }, { width: 20 }, { width: 30 }, { width: 30 },
    { width: 25 }, { width: 12 }, { width: 12 }, { width: 18 }, { width: 10 },
    { width: 15 }, { width: 6 },
  ]

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="cases.xlsx"',
    },
  })
}
```

---

## 6. Fee Ledger PDF (`app/api/export/ledger/route.ts`)

```typescript
// GET /api/export/ledger?case_id=...
// Generates full fee ledger for a case
// Shows:
//   - Case title + parties
//   - Table of all fees (date, description, mode, amount, is expense)
//   - Subtotals: Total Fees | Total Expenses | Net Outstanding
//   - Each client linked with their payment history
```

---

## 7. Invoice API Route (`app/api/export/invoice/route.ts`)

```typescript
// GET /api/export/invoice?fee_id=...
// 1. Fetch fee record with case + client
// 2. Fetch profile (for bank details, logo, QR)
// 3. Render InvoicePDF
// 4. Mark fee as invoiceGenerated = true
// 5. Return PDF buffer
```

---

## Verification Checklist
- [ ] Daily board PDF generates for any date
- [ ] Daily board groups cases by court (or judge when param passed)
- [ ] Daily board shows office name in header
- [ ] Daily board page numbers work correctly
- [ ] Invoice PDF shows client name, case reference, amount
- [ ] Invoice shows bank details and QR code if configured
- [ ] Invoice number is generated from fee ID
- [ ] Cases PDF generates with filters applied
- [ ] Cases Excel downloads correctly with all columns
- [ ] Excel column widths are set appropriately
- [ ] Fee ledger PDF shows all fees for a case with totals
- [ ] All PDFs have footer with page numbers
- [ ] Exports work for 100+ case lists without timeout
