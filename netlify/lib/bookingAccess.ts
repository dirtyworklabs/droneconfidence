/**
 * Who is allowed to book, decided in one place.
 *
 * `booking_settings.booking_enabled` in Supabase is the real switch and it is
 * the only thing that opens booking in production. The one exception is a
 * deliberately narrow local testing override, so the whole flow — hold, Stripe
 * Checkout, webhook, email — can be exercised through `netlify dev` against
 * Stripe's sandbox while the shared database switch stays off.
 *
 * The override is server-only. There is no query parameter, cookie, header,
 * admin setting or `VITE_*` variable that can reach it, and it fails closed:
 * every one of the three conditions must hold, and an unrecognised value in any
 * of them means "no".
 */

import { ENV_NAMES, env } from './env'

/** The only origin the override will accept — `netlify dev`'s default. */
const LOCAL_DEV_ORIGIN = 'http://localhost:8888'

/** Stripe's sandbox secret-key prefix. Anything else, including `sk_live_`, is refused. */
const TEST_KEY_PREFIX = 'sk_test_'

/** Trailing slashes are harmless; nothing else about the origin is normalised. */
const normaliseOrigin = (value: string): string => value.replace(/\/+$/, '')

/**
 * True only when all three of these are simultaneously true:
 *
 * 1. `BOOKING_TEST_MODE` is exactly `true`
 * 2. the explicit `SITE_URL` is exactly `http://localhost:8888` (trailing slash
 *    allowed) — the `URL` fallback that `siteOrigin()` uses is deliberately
 *    *not* consulted, because Netlify sets it on every deploy context
 * 3. `STRIPE_SECRET_KEY` begins with `sk_test_`
 *
 * The key is only ever inspected by prefix; no part of it is returned or logged.
 */
export const safeLocalBookingTestMode = (): boolean => {
  if (env(ENV_NAMES.bookingTestMode) !== 'true') return false
  if (normaliseOrigin(env(ENV_NAMES.siteUrl)) !== LOCAL_DEV_ORIGIN) return false
  return env(ENV_NAMES.stripeSecret).startsWith(TEST_KEY_PREFIX)
}

/**
 * The single definition of "a customer may book right now".
 *
 * `bookingEnabled` is the value read from `booking_settings`; when it is on,
 * nothing about test mode is consulted.
 */
export const publicBookingAllowed = (bookingEnabled: boolean): boolean =>
  bookingEnabled || safeLocalBookingTestMode()
