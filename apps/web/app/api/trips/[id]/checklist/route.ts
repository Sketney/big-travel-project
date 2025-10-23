import { NextRequest, NextResponse } from 'next/server'
import { supabaseUser } from '@/lib/supabaseUser'

type Params = { params: { id: string } }

// GET /api/trips/:id/checklist
export async function GET(_: NextRequest, { params }: Params) {
  const sb = supabaseUser()
  const { data, error } = await sb
    .from('checklist_items')
    .select('*')
    .eq('trip_id', params.id)
    .order('order_index', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ items: data })
}

// POST /api/trips/:id/checklist
// body: { title: string, due_at?: string, order_index?: number, notes?: string }
export async function POST(req: NextRequest, { params }: Params) {
  const sb = supabaseUser()
  const body = await req.json().catch(() => ({}))
  const { title, due_at = null, order_index = 0, notes = null } = body || {}
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const insert = {
    trip_id: params.id,
    title,
    due_at,
    status: 'to-do',
    order_index,
    notes,
  }

  const { data, error } = await sb.from('checklist_items').insert(insert).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ item: data }, { status: 201 })
}
