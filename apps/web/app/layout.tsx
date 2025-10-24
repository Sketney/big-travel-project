import { Suspense } from 'react'
import AnalyticsProvider from './analytics-provider'

export const metadata = {
  title: 'Travel MVP',
  description: 'Visa + Checklist + Budget (MVP)',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {/* useSearchParams/usePathname должны быть внутри Suspense */}
        <Suspense>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </Suspense>
      </body>
    </html>
  )
}
