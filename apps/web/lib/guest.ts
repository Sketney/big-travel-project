import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const COOKIE = 'guestId'
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: true,
  path: '/',
  maxAge: 60 * 60 * 24 * 365, // 1 год
}

// Универсальная генерация UUID (работает и в Edge, и в Node)
function genUUID(): string {
  const c = (globalThis as any).crypto
  if (c?.randomUUID) return c.randomUUID()
  if (c?.getRandomValues) {
    // RFC4122 v4
    const bytes = new Uint8Array(16)
    c.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    const b = Array.from(bytes, toHex)
    return `${b[0]}${b[1]}${b[2]}${b[3]}-${b[4]}${b[5]}-${b[6]}${b[7]}-${b[8]}${b[9]}-${b[10]}${b[11]}${b[12]}${b[13]}${b[14]}${b[15]}`
  }
  // Фолбэк
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
    const r = (Math.random() * 16) | 0
    const v = ch === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function readGuestId(): string | null {
  return cookies().get(COOKIE)?.value ?? null
}

// Ставит cookie на переданный ответ и возвращает значение
export function ensureGuestCookie(res: NextResponse, preset?: string): string {
  const existing = cookies().get(COOKIE)?.value
  const id = existing ?? preset ?? genUUID()
  if (!existing) res.cookies.set(COOKIE, id, COOKIE_OPTS)
  return id
}
