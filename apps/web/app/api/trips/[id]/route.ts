import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { readGuestId } from '@/lib/guest'

type Params = { params: { id: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const sb = supabaseServer()
  const guestId = readGuestId()
  const { data, error } = await sb.from('trips').select('*').eq('id', params.id).eq('user_id', guestId ?? '__none__').maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ trip: data })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const sb = supabaseServer()
  const guestId = readGuestId()
  const patch = await req.json().catch(() => ({}))
  const allowed = ['destination_country_code','destination_city','start_date','end_date','travelers_count','comfort_level','status','total_budget']
  const update: Record<string, any> = {}
  for (const k of allowed) if (k in patch) update[k] = patch[k]
  update['updated_at'] = new Date().toISOString()

  const { data, error } = await sb.from('trips').update(update).eq('id', params.id).eq('user_id', guestId ?? '__none__').select('*').maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ trip: data })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const sb = supabaseServer()
  const guestId = readGuestId()
  const { error } = await sb.from('trips').delete().eq('id', params.id).eq('user_id', guestId ?? '__none__')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
