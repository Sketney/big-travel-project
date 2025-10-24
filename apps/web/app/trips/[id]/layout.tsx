export const dynamic = 'force-dynamic'

import Link from 'next/link'

export default function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const id = params.id
  const tabStyle = {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #eee',
    textDecoration: 'none',
  } as React.CSSProperties

  return (
    <section style={{ maxWidth: 900, margin: '32px auto', padding: '0 16px', fontFamily: 'system-ui' }}>
      <nav style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Link href={`/trips/${id}/visa`} style={tabStyle}>Visa</Link>
        <Link href={`/trips/${id}/checklist`} style={tabStyle}>Checklist</Link>
        <span style={{ ...tabStyle, opacity: 0.5 }}>Timeline (скоро)</span>
        <span style={{ ...tabStyle, opacity: 0.5 }}>Budget (скоро)</span>
      </nav>
      {children}
    </section>
  )
}
