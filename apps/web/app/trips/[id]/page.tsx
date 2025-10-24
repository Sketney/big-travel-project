'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Trip = {
  id: string
  destination_country_code: string
  start_date: string
  end_date: string
  travelers_count: number
  comfort_level: 'budget' | 'medium' | 'luxury'
  status: string
}

type Item = {
  id: string
  trip_id: string
  title: string
  status: 'to-do' | 'in-progress' | 'done'
  due_at?: string | null
  order_index?: number
  notes?: string | null
}

export default function TripChecklistPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  // форма добавления
  const [title, setTitle] = useState('')
  const [due, setDue] = useState<string>('')

  async function loadAll() {
    setErr(null)
    try {
      const [tRes, cRes] = await Promise.all([
        fetch(`/api/trips/${id}`, { cache: 'no-store' }),
        fetch(`/api/trips/${id}/checklist`, { cache: 'no-store' })
      ])
      const tData = await tRes.json()
      const cData = await cRes.json()
      if (!tRes.ok) throw new Error(tData?.error || 'Failed to load trip')
      if (!cRes.ok) throw new Error(cData?.error || 'Failed to load checklist')
      setTrip(tData.trip)
      setItems((cData.items || []).sort((a: Item, b: Item) => (a.order_index ?? 0) - (b.order_index ?? 0)))
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setErr(null)
    try {
      const res = await fetch(`/api/trips/${id}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), due_at: due || null, order_index: (items[items.length - 1]?.order_index ?? 0) + 1 })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to add item')
      setItems(prev => [...prev, data.item])
      setTitle(''); setDue('')
    } catch (e: any) {
      setErr(e.message)
    }
  }

  async function toggleItem(item: Item) {
    const next = item.status === 'done' ? 'to-do' : 'done'
    try {
      const res = await fetch(`/api/checklist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update item')
      setItems(prev => prev.map(it => (it.id === item.id ? data.item : it)))
    } catch (e: any) {
      setErr(e.message)
    }
  }

  async function removeItem(item: Item) {
    try {
      const res = await fetch(`/api/checklist/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to delete item')
      }
      setItems(prev => prev.filter(it => it.id !== item.id))
    } catch (e: any) {
      setErr(e.message)
    }
  }

  if (loading) return <main style={{ padding: 16, fontFamily: 'system-ui' }}>Загрузка…</main>
  if (err) return <main style={{ padding: 16, fontFamily: 'system-ui' }}>Ошибка: {err}</main>
  if (!trip) return <main style={{ padding: 16, fontFamily: 'system-ui' }}>Поездка не найдена</main>

  return (
    <main style={{ maxWidth: 900, margin: '32px auto', padding: '0 16px', fontFamily: 'system-ui' }}>
      <p><Link href="/trips">← К списку поездок</Link></p>
      <h1>{trip.destination_country_code} · {trip.start_date} → {trip.end_date}</h1>
      <p>{trip.travelers_count} чел · {trip.comfort_level}</p>

      <section style={{ marginTop: 24 }}>
        <h2>Чек-лист</h2>

        <form onSubmit={addItem} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Новый пункт…" style={{ flex: 1, minWidth: 220 }} />
          <input type="date" value={due} onChange={e => setDue(e.target.value)} />
          <button type="submit">Добавить</button>
        </form>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map(item => (
            <li key={item.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 10, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="checkbox" checked={item.status === 'done'} onChange={() => toggleItem(item)} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, textDecoration: item.status === 'done' ? 'line-through' : 'none' }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{item.due_at ? `К сроку: ${item.due_at}` : ''}</div>
              </div>
              <button onClick={() => removeItem(item)} style={{ color: '#a00' }}>Удалить</button>
            </li>
          ))}
          {items.length === 0 && <li>Пока пусто — добавь первый пункт.</li>}
        </ul>
      </section>
    </main>
  )
}
