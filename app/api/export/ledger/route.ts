import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { pdfStyles } from '@/lib/pdf/styles'
import { format } from 'date-fns'
import React from 'react'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const caseId = searchParams.get('case_id')
  if (!caseId) return NextResponse.json({ error: 'case_id required' }, { status: 400 })

  const [caseData, profile] = await Promise.all([
    prisma.case.findUnique({
      where: { id: caseId, profileId: session.user.id },
      include: {
        fees: { orderBy: { feeDate: 'asc' } },
        clients: { include: { client: { select: { fullName: true } } } },
      },
    }),
    prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { fullName: true, officeName: true, mobile: true },
    }),
  ])

  if (!caseData) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

  const fees = caseData.fees
  const totalReceived = fees.filter(f => !f.isExpense).reduce((s, f) => s + Number(f.amount), 0)
  const totalExpenses = fees.filter(f => f.isExpense).reduce((s, f) => s + Number(f.amount), 0)
  const net = totalReceived - totalExpenses

  const LedgerPDF = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: pdfStyles.page },
      // Header
      React.createElement(
        View,
        { style: pdfStyles.header },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: pdfStyles.officeName },
            profile?.officeName ?? profile?.fullName ?? 'Advocate'
          ),
          React.createElement(Text, { style: { fontSize: 9, color: '#64748B' } },
            `Fee Ledger • Generated ${format(new Date(), 'dd MMM yyyy')}`
          )
        ),
        React.createElement(
          View,
          { style: { alignItems: 'flex-end' } },
          React.createElement(Text, { style: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#4F46E5' } },
            'FEE LEDGER'
          )
        )
      ),
      // Case info
      React.createElement(
        View,
        { style: { marginBottom: 16, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 4 } },
        React.createElement(Text, { style: { fontFamily: 'Helvetica-Bold', fontSize: 11 } },
          caseData.caseNumber ?? 'Case Reference'
        ),
        React.createElement(Text, { style: { fontSize: 10, color: '#334155', marginTop: 2 } },
          `${caseData.firstParty ?? ''} vs ${caseData.oppositeParty ?? ''}`
        ),
        React.createElement(Text, { style: { fontSize: 9, color: '#64748B', marginTop: 2 } },
          caseData.courtName ?? ''
        ),
        caseData.clients.length > 0 &&
          React.createElement(Text, { style: { fontSize: 9, color: '#64748B', marginTop: 2 } },
            `Clients: ${caseData.clients.map(cc => cc.client.fullName).join(', ')}`
          )
      ),
      // Fees table
      React.createElement(View, { style: pdfStyles.table },
        React.createElement(View, { style: pdfStyles.tableHeader },
          React.createElement(Text, { style: [pdfStyles.tableHeaderCell, { width: '15%' }] }, 'Date'),
          React.createElement(Text, { style: [pdfStyles.tableHeaderCell, { width: '35%' }] }, 'Description'),
          React.createElement(Text, { style: [pdfStyles.tableHeaderCell, { width: '15%' }] }, 'Mode'),
          React.createElement(Text, { style: [pdfStyles.tableHeaderCell, { width: '15%' }] }, 'Type'),
          React.createElement(Text, { style: [pdfStyles.tableHeaderCell, { width: '20%', textAlign: 'right' }] }, 'Amount'),
        ),
        ...fees.map((fee, i) =>
          React.createElement(
            View,
            {
              key: fee.id,
              style: [pdfStyles.tableRow, i % 2 !== 0 ? { backgroundColor: '#FAFAFA' } : {}],
            },
            React.createElement(Text, { style: [pdfStyles.tableCell, { width: '15%' }] },
              fee.feeDate ? format(new Date(fee.feeDate), 'dd/MM/yyyy') : '—'
            ),
            React.createElement(Text, { style: [pdfStyles.tableCell, { width: '35%' }] },
              fee.description ?? 'Legal Services'
            ),
            React.createElement(Text, { style: [pdfStyles.tableCell, { width: '15%' }] },
              fee.paymentMode ?? '—'
            ),
            React.createElement(Text, {
              style: [pdfStyles.tableCell, {
                width: '15%',
                color: fee.isExpense ? '#dc2626' : '#16a34a',
                fontFamily: 'Helvetica-Bold',
              }],
            }, fee.isExpense ? 'Expense' : 'Received'),
            React.createElement(Text, {
              style: [pdfStyles.tableCell, {
                width: '20%',
                textAlign: 'right',
                color: fee.isExpense ? '#dc2626' : '#334155',
              }],
            }, `Rs. ${Number(fee.amount).toLocaleString('en-IN')}`)
          )
        ),
        // Totals
        React.createElement(
          View,
          { style: { borderTopWidth: 1, borderTopColor: '#1A1A2E', paddingTop: 8, paddingHorizontal: 8, marginTop: 4 } },
          React.createElement(
            View, { style: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20 } },
            React.createElement(Text, { style: { fontSize: 9, color: '#64748B' } },
              `Total Received: Rs. ${totalReceived.toLocaleString('en-IN')}`
            ),
            React.createElement(Text, { style: { fontSize: 9, color: '#dc2626' } },
              `Total Expenses: Rs. ${totalExpenses.toLocaleString('en-IN')}`
            ),
            React.createElement(Text, { style: { fontFamily: 'Helvetica-Bold', color: net >= 0 ? '#16a34a' : '#dc2626' } },
              `Net: Rs. ${net.toLocaleString('en-IN')}`
            ),
          )
        )
      ),
      // Footer
      React.createElement(
        View,
        { style: pdfStyles.footer, fixed: true },
        React.createElement(Text, null, `Advocase — ${format(new Date(), 'dd MMM yyyy')}`),
        React.createElement(Text, {
          render: ({ pageNumber, totalPages }: any) => `Page ${pageNumber} of ${totalPages}`,
        })
      )
    )
  )

  const pdfBuffer = await renderToBuffer(LedgerPDF)

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ledger-${caseId.slice(0, 8)}.pdf"`,
    },
  })
}
