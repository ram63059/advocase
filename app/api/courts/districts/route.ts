import { NextResponse } from 'next/server'
import { getDistricts } from '@/lib/ecourts/district'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const stateCode = searchParams.get('state_code') ?? ''

  if (!stateCode) {
    return NextResponse.json({ error: 'state_code required' }, { status: 400 })
  }

  const districts = await getDistricts(stateCode)
  return NextResponse.json(districts)
}
