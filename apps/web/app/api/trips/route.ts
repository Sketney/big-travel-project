import { NextRequest, NextResponse } from 'next/server'
import { supabaseUser } from '@/lib/supabaseUser'

// GET /api/trips  → list user's trips (RLS filters by auth.uid())
export async function GET() {
  const sb = supabaseUser()
  const { data, error } = await sb
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ trips: data })
}

// POST /api/trips  → create a trip
// body: { destination_country_code: string, start_date: string, end_date: string, travelers_count?: number, comfort_level?: 'budget'|'medium'|'luxury' }
export async function POST(req: NextRequest) {
  const sb = supabaseUser()
  const body = await req.json().catch(() => ({}))
  const { destination_country_code, start_date, end_date, travelers_count = 1, comfort_level = 'medium' } = body || {}

  if (!destination_country_code || !start_date || !end_date) {
    return NextResponse.json({ error: 'destination_country_code, start_date, end_date are required' }, { status: 400 })
  }

  const insert = {
    destination_country_code,
    start_date,
    end_date,
    travelers_count,
    comfort_level,
    status: 'planning' as const,
  }

  const { data, error } = await sb.from('trips').insert(insert).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ trip: data }, { status: 201 })
}
