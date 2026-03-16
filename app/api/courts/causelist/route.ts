import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { fetchCauseList } from '@/lib/ecourts/district'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state') ?? ''
  const district = searchParams.get('district') ?? ''
  const establishment = searchParams.get('establishment') ?? ''
  const complex = searchParams.get('complex') ?? ''
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  const caseType = searchParams.get('case_type') ?? ''

  if (!state || !district) {
    return NextResponse.json({ error: 'state and district are required' }, { status: 400 })
  }

  const causeList = await fetchCauseList({
    stateCode: state,
    districtCode: district,
    complexCode: complex,
    establishmentCode: establishment,
    date,
    caseType: caseType || undefined,
  })

  return NextResponse.json({ causeList, total: causeList.length })
}
