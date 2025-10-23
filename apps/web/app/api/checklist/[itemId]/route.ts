import { NextRequest, NextResponse } from 'next/server'
import { supabaseUser } from '@/lib/supabaseUser'

type Params = { params: { itemId: string } }

// PATCH /api/checklist/:itemId
// body: { title?, status?, due_at?, order_index?, notes? }
export async function PATCH(req: NextRequest, { params }: Params) {
  const sb = supabaseUser()
  const patch = await req.json().catch(() => ({}))

  const allowed = ['title', 'status', 'due_at', 'order_index', 'notes']
  const update: Record<string, any> = {}
  for (const k of allowed) if (k in patch) update[k] = patch[k]

  const { data, error } = await sb.from('checklist_items').update(update).eq('id', params.itemId).select('*').maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ item: data })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const sb = supabaseUser()
  const { error } = await sb.from('checklist_items').delete().eq('id', params.itemId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
