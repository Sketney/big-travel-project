export const runtime = 'nodejs'

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

// PATCH /api/checklist/:itemId
// body: { title?, status?('to-do'|'done'), due_at?, order_index?, notes? }
export async function PATCH(req: NextRequest, { params }: Params) {
  const sb = supabaseServer()
  const guestId = readGuestId()
  const item = await ownItem(sb, params.itemId, guestId)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const patch = await req.json().catch(() => ({}))

  // Маппинг полей фронт→БД
  const update: Record<string, any> = {}
  if ('title' in patch) update.title = patch.title
  if ('due_at' in patch) update.due_at = patch.due_at
  if ('order_index' in patch) update.order_index = patch.order_index
  if ('notes' in patch) update.description = patch.notes
  if ('status' in patch) update.is_completed = patch.status === 'done'

  const { data, error } = await sb
    .from('checklist_items')
    .update(update)
    .eq('id', params.itemId)
    .select('*')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const itemOut = {
    ...data,
    status: data.is_completed ? 'done' : 'to-do',
    notes: data.description ?? null,
  }

  return NextResponse.json({ item: itemOut })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const sb = supabaseServer()
  const guestId = readGuestId()
  const item = await ownItem(sb, params.itemId, guestId)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await sb
    .from('checklist_items')
    .delete()
    .eq('id', params.itemId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
