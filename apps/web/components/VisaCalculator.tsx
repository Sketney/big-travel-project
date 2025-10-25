'use client'

import { useState } from 'react'

export default function VisaCalculator({
  defaultPassport = '',
  defaultCountry = '',
}: { defaultPassport?: string; defaultCountry?: string }) {
  const [citizenship, setCitizenship] = useState(defaultPassport)
  const [destination, setDestination] = useState(defaultCountry)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [visaInfo, setVisaInfo] = useState<any>(null)

  async function check(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setVisaInfo(null)
    if (!citizenship || !destination) return
    setLoading(true)
    try {
      const res = await fetch('/api/bff/visa-and-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passport: citizenship.trim().toUpperCase(),
          country: destination.trim().toUpperCase(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || ('HTTP ' + res.status))
      setVisaInfo(data)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Visa Calculator</h2>
      <form onSubmit={check} className="space-y-4 max-w-md">
        <label className="block">
          <span className="text-gray-700">Citizenship (ISO3)</span>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded"
            value={citizenship}
            onChange={(e) => setCitizenship(e.target.value.toUpperCase())}
          />
        </label>
        <label className="block">
          <span className="text-gray-700">Destination (ISO3)</span>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded"
            value={destination}
            onChange={(e) => setDestination(e.target.value.toUpperCase())}
          />
        </label>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={loading}>
          {loading ? 'Checking…' : 'Check Visa'}
        </button>
      </form>

      {err && <p className="text-red-600">Error: {err}</p>}

      {visaInfo && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-bold mb-2">Visa Information</h3>
          <p><strong>Status:</strong> {visaInfo.visa_status}</p>
          {visaInfo.source && (
            <p className="text-sm text-gray-600">
              Source: <b>{visaInfo.source.provider}</b>
              {visaInfo.source.url ? <> — <a className="underline" href={visaInfo.source.url} target="_blank">link</a></> : null}
            </p>
          )}
          {Array.isArray(visaInfo.checklist) && visaInfo.checklist.length > 0 && (
            <>
              <p className="mt-2"><strong>Required documents:</strong></p>
              <ul className="list-disc list-inside">
                {visaInfo.checklist.map((doc: any) => (
                  <li key={doc.id}>{doc.title}{doc.is_required ? ' *' : ''}</li>
                ))}
              </ul>
            </>
          )}
          <pre className="mt-3 bg-gray-50 p-2 rounded text-xs overflow-auto">{JSON.stringify(visaInfo.visa_raw, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
