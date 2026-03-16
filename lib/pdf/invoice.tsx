import React from 'react'
import { Document, Page, Text, View, Image } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { pdfStyles } from './styles'

interface InvoiceProps {
  fee: {
    id: string
    amount: number
    description: string | null
    feeDate: Date | null
    paymentMode: string | null
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
  const amount = Number(fee.amount)

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <View>
            <Text style={pdfStyles.officeName}>
              {profile.officeName ?? profile.fullName ?? 'Advocate'}
            </Text>
            {profile.officeAddress && (
              <Text style={{ fontSize: 9, color: '#64748B', marginTop: 2, maxWidth: 200 }}>
                {profile.officeAddress}
              </Text>
            )}
            {profile.mobile && (
              <Text style={{ fontSize: 9, color: '#64748B' }}>Ph: {profile.mobile}</Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#4F46E5' }}>
              INVOICE
            </Text>
            <Text style={{ fontSize: 9, color: '#64748B', marginTop: 4 }}>{invoiceNumber}</Text>
            <Text style={{ fontSize: 9, color: '#64748B' }}>
              Date: {fee.feeDate ? format(new Date(fee.feeDate), 'dd MMM yyyy') : '—'}
            </Text>
          </View>
        </View>

        {/* Bill To + Case Reference */}
        <View style={{ flexDirection: 'row', marginBottom: 20, gap: 20 }}>
          <View style={{ flex: 1, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 4 }}>
            <Text style={{ fontSize: 8, color: '#64748B', marginBottom: 4, fontFamily: 'Helvetica-Bold' }}>
              BILL TO
            </Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11 }}>
              {client?.fullName ?? 'Client'}
            </Text>
            {client?.address && (
              <Text style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>{client.address}</Text>
            )}
            {client?.mobile && (
              <Text style={{ fontSize: 9, color: '#64748B' }}>Ph: {client.mobile}</Text>
            )}
          </View>
          <View style={{ flex: 1, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 4 }}>
            <Text style={{ fontSize: 8, color: '#64748B', marginBottom: 4, fontFamily: 'Helvetica-Bold' }}>
              CASE REFERENCE
            </Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11 }}>
              {c.caseNumber ?? '—'}
            </Text>
            <Text style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>
              {c.firstParty} vs {c.oppositeParty}
            </Text>
            {c.courtName && (
              <Text style={{ fontSize: 9, color: '#64748B' }}>{c.courtName}</Text>
            )}
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
            <Text style={[pdfStyles.tableCell, { flex: 3 }]}>
              {fee.description ?? 'Legal Services'}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: 'center' }]}>
              {fee.paymentMode ?? '—'}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>
              Rs. {amount.toLocaleString('en-IN')}
            </Text>
          </View>
          {/* Total row */}
          <View
            style={{
              flexDirection: 'row',
              borderTopWidth: 1,
              borderTopColor: '#1A1A2E',
              paddingTop: 8,
              paddingHorizontal: 8,
              marginTop: 4,
            }}
          >
            <Text style={{ flex: 3, fontFamily: 'Helvetica-Bold', fontSize: 11 }}>Total</Text>
            <Text style={{ flex: 1 }} />
            <Text
              style={{
                flex: 1,
                fontFamily: 'Helvetica-Bold',
                fontSize: 14,
                textAlign: 'right',
                color: '#4F46E5',
              }}
            >
              Rs. {amount.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Payment info */}
        {(profile.bankName || profile.upiId) && (
          <View
            style={{
              marginTop: 20,
              padding: 12,
              backgroundColor: '#F8FAFC',
              borderRadius: 4,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 6 }}>
                Payment Details
              </Text>
              {profile.bankName && (
                <Text style={{ fontSize: 9, color: '#64748B' }}>
                  Bank: {profile.bankName}
                </Text>
              )}
              {profile.bankAccountNo && (
                <Text style={{ fontSize: 9, color: '#64748B' }}>
                  A/C: {profile.bankAccountNo}
                </Text>
              )}
              {profile.bankIfsc && (
                <Text style={{ fontSize: 9, color: '#64748B' }}>
                  IFSC: {profile.bankIfsc}
                </Text>
              )}
              {profile.upiId && (
                <Text style={{ fontSize: 9, color: '#64748B', marginTop: 4 }}>
                  UPI: {profile.upiId}
                </Text>
              )}
            </View>
            {profile.qrCodeUrl && (
              <Image
                src={profile.qrCodeUrl}
                style={{ width: 70, height: 70 }}
              />
            )}
          </View>
        )}

        <Text
          style={{ fontSize: 8, color: '#94A3B8', marginTop: 20, textAlign: 'center' }}
        >
          Thank you for your trust. This is a computer generated invoice.
        </Text>

        {/* Footer */}
        <View style={pdfStyles.footer} fixed>
          <Text>Advocase — Legal Case Management</Text>
          <Text>{invoiceNumber}</Text>
        </View>
      </Page>
    </Document>
  )
}
