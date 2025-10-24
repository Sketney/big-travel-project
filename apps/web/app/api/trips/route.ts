import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { readGuestId, ensureGuestCookie } from '@/lib/guest'

export async function GET() {
  const sb = supabaseServer()
  const existing = readGuestId()
  // грузим с уже существующим guestId (если он был)
  const { data = [], error } = await sb
    .from('trips')
    .select('*')
    .eq('user_id', existing ?? '__none__')
    .order('created_at', { ascending: false })

  const res = NextResponse.json({ trips: data })
  // если гостя не было — ставим куку сейчас
  if (!existing) ensureGuestCookie(res)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return res
}

// body: { destination_country_code, start_date, end_date, travelers_count?, comfort_level? }
export async function POST(req: NextRequest) {
  const sb = supabaseServer()
  const body = await req.json().catch(() => ({}))
  const { destination_country_code, start_date, end_date, travelers_count = 1, comfort_level = 'medium' } = body || {}
  if (!destination_country_code || !start_date || !end_date) {
    return NextResponse.json({ error: 'destination_country_code, start_date, end_date are required' }, { status: 400 })
  }

  // гарантируем guestId и ставим куку
  const res = NextResponse.json(null as any)
  const guestId = ensureGuestCookie(res)

  const insert = {
    user_id: guestId,
    destination_country_code: String(destination_country_code).toUpperCase(),
    start_date,
    end_date,
    travelers_count,
    comfort_level,
    status: 'planning' as const,
  }
  const { data, error } = await sb.from('trips').insert(insert).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ trip: data }, { status: 201, headers: Object.fromEntries(res.headers) })
}
