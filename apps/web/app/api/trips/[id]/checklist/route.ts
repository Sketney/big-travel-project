import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { readGuestId } from '@/lib/guest'

type Params = { params: { id: string } }

async function assertOwner(sb: any, tripId: string, guestId: string | null) {
  const { data } = await sb
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('guest_id', guestId ?? '__none__')
    .maybeSingle()
  return !!data
}

export async function GET(_: NextRequest, { params }: Params) {
  const sb = supabaseServer()
  const guestId = readGuestId()
  if (!(await assertOwner(sb, params.id, guestId))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await sb
    .from('checklist_items')
    .select('*')
    .eq('trip_id', params.id)
    .order('order_index', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ items: data || [] })
}

export async function POST(req: NextRequest, { params }: Params) {
  const sb = supabaseServer()
  const guestId = readGuestId()
  if (!(await assertOwner(sb, params.id, guestId))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const { title, due_at = null, order_index = 0, notes = null } = body || {}
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const insert = { trip_id: params.id, title, due_at, status: 'to-do', order_index, notes }
  const { data, error } = await sb.from('checklist_items').insert(insert).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ item: data }, { status: 201 })
}
