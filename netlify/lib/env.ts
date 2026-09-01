/**
 * Server-side environment access.
 *
 * Reads through `Netlify.env` when running as a function and falls back to
 * `process.env` so the same modules can be unit tested. Values are never logged
 * anywhere in this codebase; only the *name* of a missing variable is reported.
 */

interface NetlifyGlobal {
  Netlify?: { env?: { get(name: string): string | undefined } }
}

export const env = (name: string): string => {
  const scope = globalThis as NetlifyGlobal
  const value = scope.Netlify?.env?.get(name) ?? process.env[name]
  return (value ?? '').trim()
}

export const requireEnv = (...names: string[]): { ok: true } | { ok: false; missing: string[] } => {
  const missing = names.filter((name) => env(name).length === 0)
  return missing.length === 0 ? { ok: true } : { ok: false, missing }
}

/** Absolute site origin used for Stripe return URLs and email links. */
export const siteOrigin = (): string => {
  const configured = env('SITE_URL') || env('URL')
  return configured.replace(/\/+$/, '')
}

export const ENV_NAMES = {
  supabaseUrl: 'SUPABASE_URL',
  supabaseSecret: 'SUPABASE_SECRET_KEY',
  stripeSecret: 'STRIPE_SECRET_KEY',
  stripeWebhookSecret: 'STRIPE_WEBHOOK_SECRET',
  resendKey: 'RESEND_API_KEY',
  resendFrom: 'RESEND_FROM_EMAIL',
  resendReplyTo: 'RESEND_REPLY_TO',
  adminEmail: 'ADMIN_NOTIFICATION_EMAIL',
  siteUrl: 'SITE_URL',
} as const
