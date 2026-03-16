import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createCaseSchema = z.object({
  courtType: z.string().optional(),
  courtName: z.string().optional(),
  courtNo: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  caseNumber: z.string().optional(),
  cnrNumber: z.string().optional(),
  referenceNo: z.string().optional(),
  fileNo: z.string().optional(),
  fileName: z.string().optional(),
  year: z.number().optional().nullable(),
  firstParty: z.string().optional(),
  oppositeParty: z.string().optional(),
  caseType: z.string().optional(),
  underSection: z.string().optional(),
  policeStation: z.string().optional(),
  firNumber: z.string().optional(),
  judgeName: z.string().optional(),
  company: z.string().optional(),
  empanelment: z.string().optional(),
  comments: z.string().optional(),
  filingDate: z.string().optional().nullable(),
  previousDate: z.string().optional().nullable(),
  nextDate: z.string().optional().nullable(),
  fixedFor: z.string().optional(),
  status: z.enum(['running', 'decided', 'abandoned']).default('running'),
  isImportant: z.boolean().default(false),
  briefFacts: z.string().optional(),
  relevantLaws: z.string().optional(),
  clientIds: z.array(z.string()).optional(),
})

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const page = parseInt(searchParams.get('page') ?? '1')

  const cases = await prisma.case.findMany({
    where: {
      profileId: session.user.id,
      ...(status && { status }),
    },
    select: {
      id: true, caseNumber: true, firstParty: true, oppositeParty: true,
      courtName: true, courtType: true, nextDate: true, status: true,
    },
    orderBy: { nextDate: 'asc' },
    take: limit,
    skip: (page - 1) * limit,
  })

  return NextResponse.json(cases)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = createCaseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
    }

    const { clientIds, filingDate, previousDate, nextDate, ...caseFields } = parsed.data

    const newCase = await prisma.case.create({
      data: {
        ...caseFields,
        profileId: session.user.id,
        filingDate: filingDate ? new Date(filingDate) : null,
        previousDate: previousDate ? new Date(previousDate) : null,
        nextDate: nextDate ? new Date(nextDate) : null,
        createdBy: session.user.id,
        ...(clientIds?.length && {
          clients: {
            create: clientIds.map(clientId => ({ clientId })),
          },
        }),
      },
    })

    return NextResponse.json(newCase, { status: 201 })
  } catch (error) {
    console.error('Create case error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
