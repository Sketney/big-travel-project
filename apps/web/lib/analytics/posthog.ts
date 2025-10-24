'use client'
import posthog from 'posthog-js'

let inited = false
export function initPosthog() {
  if (inited || typeof window === 'undefined') return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com'
  if (!key) return
  posthog.init(key, {
    api_host: host,
    capture_pageview: false,     // сами пошлём $pageview ниже
    capture_pageleave: true,
    person_profiles: 'identified_only', // чтобы не плодить профили анонимов
  })
  inited = true
}

export { posthog }
