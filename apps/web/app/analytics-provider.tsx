'use client'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPosthog, posthog } from '@/lib/analytics/posthog'

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => { initPosthog() }, [])
  const pathname = usePathname()
  const searchParams = useSearchParams()
  useEffect(() => {
    // страница изменилась — шлём $pageview
    if ((posthog as any)?.__loaded) posthog.capture('$pageview')
    else posthog.capture('$pageview')
  }, [pathname, searchParams])
  return <>{children}</>
}
