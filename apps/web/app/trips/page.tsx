'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Trip = {
  id: string
  destination_country_code: string
  start_date: string
  end_date: string
  travelers_count: number
  comfort_level: 'budget' | 'medium' | 'luxury'
  status: string
  created_at?: string
}

export default function TripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // форма
  const [destination, setDestination] = useState('THA')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [people, setPeople] = useState(1)
  const [comfort, setComfort] = useState<'budget' | 'medium' | 'luxury'>('medium')

  async function loadTrips() {
    setErr(null)
    try {
      const res = await fetch('/api/trips', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load trips')
      setTrips(data.trips || [])
    } catch (e: any) {
      setErr(e.message)
    }
  }

  useEffect(() => {
    loadTrips()
  }, [])

  async function createTrip(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(null)
    try {
      const body = {
        destination_country_code: destination.trim().toUpperCase(),
        start_date: start,
        end_date: end,
        travelers_count: people,
        comfort_level: comfort
      }
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create trip')
      const id = data?.trip?.id
      if (id) router.push(`/trips/${id}/visa`)
      else await loadTrips()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '32px auto', padding: '0 16px', fontFamily: 'system-ui' }}>
      <h1>Мои поездки</h1>
      <p><Link href="/">← На главную</Link></p>

      <section style={{ marginTop: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Создать поездку</h2>
        <form onSubmit={createTrip} style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div>
            <label>Страна (ISO3)</label>
            <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="THA" style={{ width: '100%' }}/>
          </div>
          <div>
            <label>Дата начала</label>
            <input type="date" value={start} onChange={e => setStart(e.target.value)} style={{ width: '100%' }}/>
          </div>
          <div>
            <label>Дата конца</label>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={{ width: '100%' }}/>
          </div>
          <div>
            <label>Путешественников</label>
            <input type="number" min={1} value={people} onChange={e => setPeople(parseInt(e.target.value || '1', 10))} style={{ width: '100%' }}/>
          </div>
          <div>
            <label>Комфорт</label>
            <select value={comfort} onChange={e => setComfort(e.target.value as any)} style={{ width: '100%' }}>
              <option value="budget">Budget</option>
              <option value="medium">Medium</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>
          <div style={{ alignSelf: 'end' }}>
            <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
              {loading ? 'Создаю…' : 'Создать поездку'}
            </button>
          </div>
        </form>
        {err && <p style={{ color: 'red', marginTop: 8 }}>Ошибка: {err}</p>}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Список</h2>
        {trips.length === 0 && <p>Пока нет поездок.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {trips.map(t => (
            <li key={t.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <b>{t.destination_country_code}</b> · {t.start_date} → {t.end_date} · {t.travelers_count} чел · {t.comfort_level}
                </div>
                <div>
                  <Link href={`/trips/${t.id}`}>Открыть</Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
