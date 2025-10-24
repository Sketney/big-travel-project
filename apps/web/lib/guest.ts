import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const COOKIE = 'guestId'
const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax' as const, secure: true, path: '/', maxAge: 60*60*24*365 } // 1 год

export function readGuestId(): string | null {
  return cookies().get(COOKIE)?.value ?? null
}

export function ensureGuestCookie(res: NextResponse): string {
  const existing = cookies().get(COOKIE)?.value
  if (existing) return existing
  const id = randomUUID()
  res.cookies.set(COOKIE, id, COOKIE_OPTS)
  return id
}
