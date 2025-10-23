export const metadata = {
  title: 'Travel MVP',
  description: 'Visa + Checklist + Budget (MVP)',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 800, margin: '32px auto', padding: '0 16px' }}>{children}</div>
      </body>
    </html>
  )
}
