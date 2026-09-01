/**
 * Supabase service-role client.
 *
 * `SUPABASE_SECRET_KEY` is server-only and bypasses RLS, so this module is
 * imported by Netlify Functions and nothing else. The public site never talks to
 * Supabase directly: React → Netlify Function → Supabase.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { ENV_NAMES, env, requireEnv } from './env'

export class ConfigurationError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Missing environment configuration: ${missing.join(', ')}`)
    this.name = 'ConfigurationError'
  }
}

let cached: SupabaseClient | null = null

export const serviceClient = (): SupabaseClient => {
  if (cached) return cached

  const check = requireEnv(ENV_NAMES.supabaseUrl, ENV_NAMES.supabaseSecret)
  if (!check.ok) throw new ConfigurationError(check.missing)

  cached = createClient(env(ENV_NAMES.supabaseUrl), env(ENV_NAMES.supabaseSecret), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'drone-confidence-booking' } },
  })
  return cached
}

/** True when the booking backend is configured enough to be worth calling. */
export const bookingBackendConfigured = (): boolean =>
  requireEnv(ENV_NAMES.supabaseUrl, ENV_NAMES.supabaseSecret).ok
