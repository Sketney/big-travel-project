export const runtime = 'nodejs'

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

// GET /api/trips/:id/checklist
export async function GET(_: NextRequest, { params }: Params) {
  const sb = supabaseServer()
  const guestId = readGuestId()
  if (!(await assertOwner(sb, params.id, guestId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data, error } = await sb
    .from('checklist_items')
    .select('*')
    .eq('trip_id', params.id)
    .order('order_index', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Приводим к фронтовому виду: status + notes
  const items = (data || []).map((it: any) => ({
    ...it,
    status: it.is_completed ? 'done' : 'to-do',
    notes: it.description ?? null,
  }))

  return NextResponse.json({ items })
}

// POST /api/trips/:id/checklist
// body: { title: string, due_at?: string, order_index?: number, notes?: string }
export async function POST(req: NextRequest, { params }: Params) {
  const sb = supabaseServer()
  const guestId = readGuestId()
  if (!(await assertOwner(sb, params.id, guestId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const { title, due_at = null, order_index = 0, notes = null } = body || {}
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  // В БД пишем description/is_completed
  const insert = {
    trip_id: params.id,
    title,
    description: notes,
    due_at,
    is_completed: false,
    order_index,
  }

  const { data, error } = await sb
    .from('checklist_items')
    .insert(insert)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Возвращаем с приведёнными полями
  const item = {
    ...data,
    status: data.is_completed ? 'done' : 'to-do',
    notes: data.description ?? null,
  }

  return NextResponse.json({ item }, { status: 201 })
}
