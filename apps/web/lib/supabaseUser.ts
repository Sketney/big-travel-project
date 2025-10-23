import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Returns a Supabase client bound to the current user's session via cookies.
 * Works with RLS enabled (uses anon key). Do NOT use for admin/service ops.
 */
export function supabaseUser() {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createServerClient(url, anon, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: () => {},
      remove: () => {},
    },
  })
}
