'use client'
import { useEffect, useState } from 'react'

type Item = {
  id: string
  title: string
  description: string | null
  due_at: string | null
  is_completed: boolean
  order_index?: number
}

export default function Checklist({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<Item[]>([])
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [err, setErr] = useState<string | null>(null)

  async function load() {
    setErr(null)
    const res = await fetch(`/api/trips/${tripId}/checklist`, { cache: 'no-store' })
    const data = await res.json()
    if (!res.ok) { setErr(data?.error || 'Load failed'); return }
    setItems(data.items || [])
  }
  useEffect(() => { load() }, [tripId])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const res = await fetch(`/api/trips/${tripId}/checklist`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), due_at: due || null, order_index: (items.at(-1)?.order_index ?? 0) + 1 }),
    })
    const data = await res.json()
    if (!res.ok) { setErr(data?.error || 'Add failed'); return }
    setItems([...items, data.item]); setTitle(''); setDue('')
  }

  async function toggle(it: Item) {
    const res = await fetch(`/api/checklist/${it.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: it.is_completed ? 'to-do' : 'done' }),
    })
    const data = await res.json()
    if (!res.ok) { setErr(data?.error || 'Update failed'); return }
    setItems(items.map(x => x.id === it.id ? { ...x, is_completed: !it.is_completed } : x))
  }

  async function remove(it: Item) {
    const res = await fetch(`/api/checklist/${it.id}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json().catch(()=>({})); setErr(d?.error || 'Delete failed'); return }
    setItems(items.filter(x => x.id !== it.id))
  }

  return (
  <div className="space-y-6">
    <h2 className="text-2xl font-semibold">Чек-лист</h2>

    <form onSubmit={add} className="flex gap-3 flex-wrap items-center">
      <input className="border rounded px-3 py-2 min-w-[240px]" placeholder="Новый пункт…"
             value={title} onChange={e=>setTitle(e.target.value)} />
      <input type="date" className="border rounded px-3 py-2" value={due} onChange={e=>setDue(e.target.value)} />
      <button className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Добавить</button>
      {err && <span className="text-red-600">{err}</span>}
    </form>

    <ul className="space-y-2">
      {items.map(it => (
        <li key={it.id} className="flex items-center gap-3 border rounded-md p-3 bg-white">
          <input type="checkbox" checked={it.is_completed} onChange={()=>toggle(it)} />
          <div className="flex-1">
            <div className={it.is_completed ? 'line-through text-gray-400' : 'font-medium'}>{it.title}</div>
            {it.due_at && <div className="text-xs text-gray-500">К сроку: {it.due_at}</div>}
          </div>
          <button onClick={()=>remove(it)} className="text-red-700 hover:underline">Удалить</button>
        </li>
      ))}
      {items.length === 0 && <li className="text-gray-500">Пока пусто — добавь первый пункт.</li>}
    </ul>
  </div>
)
