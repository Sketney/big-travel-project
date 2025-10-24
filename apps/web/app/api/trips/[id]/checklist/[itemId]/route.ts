import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { readGuestId } from '@/lib/guest'

type Params = { params: { itemId: string } }

async function ownItem(sb: any, itemId: string, guestId: string | null) {
  const { data: item } = await sb
    .from('checklist_items')
    .select('id, trip_id')
    .eq('id', itemId)
    .maybeSingle()
  if (!item) return null
  const { data: trip } = await sb
    .from('trips')
    .select('id')
    .eq('id', item.trip_id)
    .eq('guest_id', guestId ?? '__none__')
    .maybeSingle()
  return trip ? item : null
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const sb = supabaseServer()
  const guestId = readGuestId()
  const item = await ownItem(sb, params.itemId, guestId)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const patch = await req.json().catch(() => ({}))
  const allowed = ['title','status','due_at','order_index','notes']
  const update: Record<string, any> = {}
  for (const k of allowed) if (k in patch) update[k] = patch[k]

  const { data, error } = await sb
    .from('checklist_items')
    .update(update)
    .eq('id', params.itemId)
    .select('*')
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ item: data })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const sb = supabaseServer()
  const guestId = readGuestId()
  const item = await ownItem(sb, params.itemId, guestId)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await sb.from('checklist_items').delete().eq('id', params.itemId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
