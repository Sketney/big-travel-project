export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { readGuestId, ensureGuestCookie } from '@/lib/guest'

// GET /api/trips → список поездок гостя
export async function GET() {
  const sb = supabaseServer()
  const existing = readGuestId()
  const guestId = existing ?? undefined

  const { data = [], error } = await sb
    .from('trips')
    .select('*')
    .eq('guest_id', guestId ?? '__none__')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const res = NextResponse.json({ trips: data })
  if (!existing) ensureGuestCookie(res) // ставим cookie прямо на возвращаемый ответ
  return res
}

// POST /api/trips → создать поездку (guest)
export async function POST(req: NextRequest) {
  const sb = supabaseServer()
  const body = await req.json().catch(() => ({}))
  const {
    destination_country_code,
    start_date,
    end_date,
    travelers_count = 1,
    comfort_level = 'medium',
  } = body || {}

  if (!destination_country_code || !start_date || !end_date) {
    return NextResponse.json(
      { error: 'destination_country_code, start_date, end_date are required' },
      { status: 400 },
    )
  }

  // получим/сгенерим guestId, не трогая тело ответа
  let guestId = readGuestId()
  if (!guestId) {
    const probe = NextResponse.json({ ok: true }) // временный response лишь чтобы получить id
    guestId = ensureGuestCookie(probe)            // вернёт сгенерированный id
  }

  const insert = {
    guest_id: guestId!,
    destination_country_code: String(destination_country_code).toUpperCase(),
    start_date,
    end_date,
    travelers_count,
    comfort_level,
    status: 'planning' as const,
  }

  const { data, error } = await sb.from('trips').insert(insert).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // формируем финальный ответ и ставим cookie на него
  const res = NextResponse.json({ trip: data }, { status: 201 })
  ensureGuestCookie(res, guestId!)
  return res
}
