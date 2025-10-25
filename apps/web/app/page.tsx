'use client'

export const dynamic = 'force-dynamic' // не даём Next пытаться пререндерить страницу

import { useEffect, useState } from 'react'
import posthog from 'posthog-js'

export default function Home() {
  // === PostHog: минимальная инициализация + $pageview ===
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com' // поменяй на eu, если проект в ЕС
    if (!key) return
    posthog.init(key, { api_host: host, capture_pageview: false })
    posthog.capture('$pageview')
  }, [])
  // ======================================================

  const [passport, setPassport] = useState('RUS')
  const [country, setCountry] = useState('THA')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function check() {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch('/api/bff/visa-and-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passport, country })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || ('HTTP ' + res.status))
      setResult(data)

      // событие успеха
      try { posthog.capture('visa_check_succeeded', { passport, country, visa_status: data?.visa_status ?? null }) } catch {}
    } catch (e: any) {
      setError(e.message)

      // событие ошибки
      try { posthog.capture('visa_check_failed', { passport, country, error: String(e?.message || e).slice(0, 200) }) } catch {}
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: '32px auto', padding: '0 16px', fontFamily: 'system-ui' }}>
      <h1>Travel MVP</h1>
      <p>Быстрый чек: нужна ли виза и что подготовить.</p>
      <p style={{ marginTop: 8 }}>
        <a href="/trips">→ Перейти к поездкам</a>
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <input value={passport} onChange={e => setPassport(e.target.value.toUpperCase())} placeholder="Паспорт (ISO3)" />
        <input value={country} onChange={e => setCountry(e.target.value.toUpperCase())} placeholder="Страна (ISO3)" />
        <button onClick={check} disabled={loading}>{loading ? 'Проверяю…' : 'Проверить'}</button>
      </div>

      {error && <p style={{ color: 'red' }}>Ошибка: {error}</p>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <h2>Результат</h2>
          <pre style={{ background: '#f6f8fa', padding: 12, borderRadius: 8 }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </main>
  )
}
