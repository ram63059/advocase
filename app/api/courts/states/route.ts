import { NextResponse } from 'next/server'
import states from '@/data/ecourts-states.json'

export async function GET() {
  return NextResponse.json(states)
}
