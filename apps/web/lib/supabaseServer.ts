import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client.
 * Uses SERVICE ROLE key. NEVER import this in client components.
 */
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  if (!url || !serviceKey) {
    throw new Error("Supabase URL or Service Role Key is missing in environment")
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  })
}
