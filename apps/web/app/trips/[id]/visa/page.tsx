'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import posthog from 'posthog-js'

type Trip = {
  id: string
  destination_country_code: string
  start_date: string
  end_date: string
}

export default function TripVisaPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [trip, setTrip] = useState<Trip | null>(null)
  const [passport, setPassport] = useState('RUS') // можно хранить в localStorage/профиле
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  // грузим поездку (для страны назначения)
  useEffect(() => {
    async function loadTrip() {
      try {
        const res = await fetch(`/api/trips/${id}`, { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed to load trip')
        setTrip(data.trip)
      } catch (e: any) {
        setError(e.message)
      }
    }
    loadTrip()
  }, [id])

  async function checkVisa() {
    if (!trip) return
    setLoading(true); setError(null); setResult(null)
    try {
      posthog.capture('visa_check_started', { trip_id: id, passport, country: trip.destination_country_code })
      const res = await fetch('/api/bff/visa-and-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passport, country: trip.destination_country_code })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || ('HTTP ' + res.status))
      setResult(data)
      posthog.capture('visa_check_succeeded', { trip_id: id, passport, country: trip.destination_country_code, visa_status: data?.visa_status ?? null })
    } catch (e: any) {
      setError(e.message)
      posthog.capture('visa_check_failed', { trip_id: id, passport, error: String(e?.message || e).slice(0, 200) })
    } finally {
      setLoading(false)
    }
  }

  function reportOutdated() {
    // клиентская метка в PostHog вместо сервера/БД
    posthog.capture('visa_report_outdated', {
      trip_id: id,
      passport,
      country: trip?.destination_country_code ?? null,
      visa_status: result?.visa_status ?? null
    })
    alert('Спасибо! Мы отметили, что эти требования нужно перепроверить.')
  }

  return (
    <main>
      <p><Link href="/trips">← К списку поездок</Link></p>
      <h1>Visa • Поездка {trip?.destination_country_code || ''}</h1>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <label>Паспорт (ISO3)</label>
        <input value={passport} onChange={e => setPassport(e.target.value.toUpperCase())} placeholder="RUS" />
        <button onClick={checkVisa} disabled={loading || !trip}>{loading ? 'Проверяю…' : 'Проверить визу'}</button>
      </div>

      {error && <p style={{ color: 'red', marginTop: 8 }}>Ошибка: {error}</p>}

      {result && (
        <div style={{ marginTop: 16, border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 14, color: '#666' }}>
            {result.last_updated ? `Обновлено: ${new Date(result.last_updated).toLocaleDateString()}` : 'Обновление: нет данных'}
          </div>
          <h2 style={{ margin: '8px 0 12px' }}>Статус: {result.visa_status}</h2>

          {result.source && (
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
              Источник: <b>{result.source.provider}</b>{' '}
              {result.source.url ? (
                <a href={result.source.url} target="_blank" rel="noreferrer">ссылка</a>
              ) : null}
            </div>
          )}

          {Array.isArray(result.checklist) && result.checklist.length > 0 && (
            <>
              <h3>Основные документы</h3>
              <ul>
                {result.checklist.map((it: any) => (
                  <li key={it.id}>{it.title}{it.is_required ? ' *' : ''}</li>
                ))}
              </ul>
            </>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={reportOutdated}>Сообщить, что устарело</button>
            <Link href={`/trips/${id}/checklist`}>Перейти к чек-листу</Link>
          </div>
        </div>
      )}
    </main>
  )
}
