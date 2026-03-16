import { NextResponse } from 'next/server'
import { getComplexes } from '@/lib/ecourts/district'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const stateCode = searchParams.get('state_code') ?? ''
  const districtCode = searchParams.get('district_code') ?? ''

  if (!stateCode || !districtCode) {
    return NextResponse.json({ error: 'state_code and district_code required' }, { status: 400 })
  }

  const complexes = await getComplexes(stateCode, districtCode)
  return NextResponse.json(complexes)
}
