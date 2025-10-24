import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { readGuestId, ensureGuestCookie } from '@/lib/guest'
import { randomUUID } from 'crypto'

// GET /api/trips  → список поездок гостя
export async function GET() {
  const sb = supabaseServer()
  const existing = readGuestId()
  const guestId = existing ?? randomUUID()

  const { data = [], error } = await sb
    .from('trips')
    .select('*')
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false })

  const res = NextResponse.json({ trips: data })
  if (!existing) ensureGuestCookie(res, guestId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return res
}

// POST /api/trips  → создать поездку (гостевую)
export async function POST(req: NextRequest) {
  const sb = supabaseServer()
  const body = await req.json().catch(() => ({}))
  const { destination_country_code, start_date, end_date, travelers_count = 1, comfort_level = 'medium' } = body || {}

  if (!destination_country_code || !start_date || !end_date) {
    return NextResponse.json({ error: 'destination_country_code, start_date, end_date are required' }, { status: 400 })
  }

  const existing = readGuestId()
  const guestId = existing ?? randomUUID()

  const insert = {
    guest_id: guestId, // ← ключевая смена
    destination_country_code: String(destination_country_code).toUpperCase(),
    start_date,
    end_date,
    travelers_count,
    comfort_level,
    status: 'planning' as const,
  }

  const { data, error } = await sb.from('trips').insert(insert).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const res = NextResponse.json({ trip: data }, { status: 201 })
  if (!existing) ensureGuestCookie(res, guestId)
  return res
}
