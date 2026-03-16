import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/lib/pdf/invoice'
import React from 'react'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const feeId = searchParams.get('fee_id')
  if (!feeId) return NextResponse.json({ error: 'fee_id required' }, { status: 400 })

  const fee = await prisma.fee.findFirst({
    where: { id: feeId, profileId: session.user.id },
    include: {
      case: {
        select: {
          caseNumber: true,
          firstParty: true,
          oppositeParty: true,
          courtName: true,
          clients: {
            include: {
              client: { select: { fullName: true, address: true, mobile: true } },
            },
            take: 1,
          },
        },
      },
    },
  })

  if (!fee) return NextResponse.json({ error: 'Fee not found' }, { status: 404 })

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: {
      fullName: true,
      officeName: true,
      officeAddress: true,
      mobile: true,
      logoUrl: true,
      qrCodeUrl: true,
      bankName: true,
      bankAccountName: true,
      bankIfsc: true,
      bankAccountNo: true,
      upiId: true,
    },
  })

  const firstClient = fee.case?.clients[0]?.client ?? null

  const pdfBuffer = await renderToBuffer(
    React.createElement(InvoicePDF, {
      fee: {
        id: fee.id,
        amount: Number(fee.amount),
        description: fee.description,
        feeDate: fee.feeDate,
        paymentMode: fee.paymentMode,
      },
      case: {
        caseNumber: fee.case?.caseNumber ?? null,
        firstParty: fee.case?.firstParty ?? null,
        oppositeParty: fee.case?.oppositeParty ?? null,
        courtName: fee.case?.courtName ?? null,
      },
      client: firstClient,
      profile: profile ?? {
        fullName: null, officeName: null, officeAddress: null, mobile: null,
        logoUrl: null, qrCodeUrl: null, bankName: null, bankAccountName: null,
        bankIfsc: null, bankAccountNo: null, upiId: null,
      },
    })
  )

  // Mark as invoiceGenerated
  await prisma.fee.update({
    where: { id: feeId },
    data: { invoiceGenerated: true },
  })

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${feeId.slice(0, 8)}.pdf"`,
    },
  })
}
