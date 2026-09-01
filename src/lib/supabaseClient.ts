/**
 * Supabase Auth in the browser, for the owner login only.
 *
 * This client exists purely so the single admin account can sign in and obtain a
 * token; every admin Netlify Function then re-verifies that token server-side and
 * checks the email against `ADMIN_NOTIFICATION_EMAIL`. No booking data is read
 * or written from the browser through Supabase.
 *
 * `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are publishable
 * credentials, and both are optional: without them this returns null, the public
 * site is unaffected and /admin/login says the dashboard is not configured.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const publishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim()

export const adminAuthConfigured = url.length > 0 && publishableKey.length > 0

let cached: SupabaseClient | null = null

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!adminAuthConfigured) return null
  if (!cached) {
    cached = createClient(url, publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  }
  return cached
}
