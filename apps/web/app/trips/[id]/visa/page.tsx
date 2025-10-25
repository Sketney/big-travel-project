'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'

type Trip = {
  id: string
  destination_country_code: string
  start_date: string
  end_date: string
}

export default function TripVisaPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [passport, setPassport] = useState('RUS') // можно хранить в localStorage/профиле
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  // грузим поездку (для страны назначения)
  useEffect(() => {
    let aborted = false
    async function loadTrip() {
      try {
        const res = await fetch(`/api/trips/${id}`, { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed to load trip')
        if (!aborted) setTrip(data.trip)
      } catch (e: any) {
        if (!aborted) setError(e.message)
      }
    }
    loadTrip()
    return () => { aborted = true }
  }, [id])

  async function checkVisa() {
    if (!trip) return null
    setLoading(true); setError(null); setResult(null)
    try {
      posthog?.capture('visa_check_started', { trip_id: id, passport, country: trip.destination_country_code })
      const res = await fetch('/api/bff/visa-and-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passport, country: trip.destination_country_code })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || ('HTTP ' + res.status))
      setResult(data)
      posthog?.capture('visa_check_succeeded', {
        trip_id: id,
        passport,
        country: trip.destination_country_code,
        visa_status: data?.visa_status ?? null
      })
      return data
    } catch (e: any) {
      setError(e.message)
      posthog?.capture('visa_check_failed', {
        trip_id: id,
        passport,
        error: String(e?.message || e).slice(0, 200)
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  async function generateChecklistAndGo() {
    try {
      setSaving(true)
      // 1) Если ещё не запрашивали визу — получим результат
      let latestResult = result
      if (!latestResult) {
        latestResult = await checkVisa()
      }
      if (!latestResult) {
        throw new Error('Не удалось получить визовые требования')
      }

      const docs = Array.isArray(latestResult?.checklist) ? latestResult.checklist : []
      if (docs.length === 0) {
        // нет документов — просто переходим дальше
        router.push(`/trips/${id}/checklist`)
        return
      }

      // 2) Создаём пункты чек-листа (по одному; оптимально — батчем на сервере)
      for (let i = 0; i < docs.length; i++) {
        const d = docs[i]
        const response = await fetch(`/api/trips/${id}/checklist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: d.title,
            notes: d.notes ?? null,
            order_index: typeof d.order_index === 'number' ? d.order_index : i,
            // due_at: можно вычислять от даты вылета, когда добавим offset в ответ
          }),
        })
        if (!response.ok) {
          let message = ''
          try {
            const payload = await response.json()
            message = payload?.error || ''
          } catch { /* ignore */ }
          throw new Error(message || `Не удалось сохранить пункт "${d.title ?? i}" (HTTP ${response.status})`)
        }
      }

      // 3) Идём к чек-листу
      router.push(`/trips/${id}/checklist`)
    } catch (e) {
      const errorMessage = (e as any)?.message ?? String(e)
      alert('Не удалось сформировать чек-лист: ' + errorMessage)
    } finally {
      setSaving(false)
    }
  }

  function reportOutdated() {
    // клиентская метка в PostHog вместо сервера/БД
    posthog?.capture('visa_report_outdated', {
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
        <input
          value={passport}
          onChange={e => setPassport(e.target.value.toUpperCase())}
          placeholder="RUS"
        />
        <button onClick={checkVisa} disabled={loading || !trip}>
          {loading ? 'Проверяю…' : 'Проверить визу'}
        </button>
      </div>

      {error && <p style={{ color: 'red', marginTop: 8 }}>Ошибка: {error}</p>}

      {result && (
        <div style={{ marginTop: 16, border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 14, color: '#666' }}>
            {result.last_updated
              ? `Обновлено: ${new Date(result.last_updated).toLocaleDateString()}`
              : 'Обновление: нет данных'}
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

          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button onClick={reportOutdated}>Сообщить, что устарело</button>
            <button onClick={generateChecklistAndGo} disabled={saving}>
              {saving ? 'Сохраняю…' : 'Перейти к чек-листу (сохранить пункты)'}
            </button>
            <Link href={`/trips/${id}/checklist`} style={{ opacity: 0.7 }}>
              Перейти к чек-листу (без сохранения)
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
