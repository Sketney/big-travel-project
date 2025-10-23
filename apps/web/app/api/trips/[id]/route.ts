import { NextRequest, NextResponse } from 'next/server'
import { supabaseUser } from '@/lib/supabaseUser'

type Params = { params: { id: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const sb = supabaseUser()
  const { data, error } = await sb.from('trips').select('*').eq('id', params.id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ trip: data })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const sb = supabaseUser()
  const patch = await req.json().catch(() => ({}))

  // Only allow safe fields to be updated
  const allowed = ['destination_country_code', 'destination_city', 'start_date', 'end_date', 'travelers_count', 'comfort_level', 'status', 'total_budget']
  const update: Record<string, any> = {}
  for (const k of allowed) if (k in patch) update[k] = patch[k]
  update['updated_at'] = new Date().toISOString()

  const { data, error } = await sb.from('trips').update(update).eq('id', params.id).select('*').maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ trip: data })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const sb = supabaseUser()
  const { error } = await sb.from('trips').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
