/**
 * Admin authorisation for Netlify Functions.
 *
 * Hiding the /admin route protects nothing. Every admin function calls
 * `requireAdmin()` first, which verifies the bearer token with Supabase Auth
 * server-side and then requires the authenticated email to be the owner address
 * in `ADMIN_NOTIFICATION_EMAIL`. A valid Supabase user who is not the owner is
 * rejected exactly like an anonymous request.
 */

import { createClient } from '@supabase/supabase-js'
import { ENV_NAMES, env } from './env'
import { jsonResponse } from './http'

export interface AdminIdentity {
  email: string
  userId: string
}

export type AdminAuthResult = { ok: true; identity: AdminIdentity } | { ok: false; response: Response }

const unauthorized = (): Response =>
  jsonResponse({ status: 'error', message: 'Not authorised.' }, 401)

const bearerToken = (request: Request): string | null => {
  const header = request.headers.get('authorization') ?? ''
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match ? match[1].trim() : null
}

export const requireAdmin = async (request: Request): Promise<AdminAuthResult> => {
  const ownerEmail = env(ENV_NAMES.adminEmail).toLowerCase()
  const url = env(ENV_NAMES.supabaseUrl)
  const secret = env(ENV_NAMES.supabaseSecret)

  // Without the owner address configured there is nobody to authorise, so
  // everything is refused rather than opened up.
  if (ownerEmail.length === 0 || url.length === 0 || secret.length === 0) {
    return { ok: false, response: unauthorized() }
  }

  const token = bearerToken(request)
  if (!token) return { ok: false, response: unauthorized() }

  try {
    // A throwaway client so the caller's token is never attached to the shared
    // service-role client used for data access.
    const auth = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await auth.auth.getUser(token)
    const email = data?.user?.email?.toLowerCase() ?? ''

    if (error || email.length === 0 || email !== ownerEmail) {
      return { ok: false, response: unauthorized() }
    }
    return { ok: true, identity: { email, userId: data.user!.id } }
  } catch {
    return { ok: false, response: unauthorized() }
  }
}
