import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requireAdmin } from '../netlify/lib/adminAuth'

/**
 * The admin gate.
 *
 * The route being unlisted is presentation. This is the actual boundary: a token
 * is verified with Supabase server-side, and the authenticated address must be
 * the owner's. A perfectly valid Supabase user who is not the owner is refused
 * exactly like an anonymous request.
 */

const getUser = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { getUser } }),
}))

const OWNER = 'Owner@DroneConfidence.com.au'

const call = (token?: string) =>
  requireAdmin(
    new Request('https://example.test/.netlify/functions/admin-bookings', {
      headers: token ? { authorization: token } : {},
    }),
  )

beforeEach(() => {
  getUser.mockReset()
  process.env.ADMIN_NOTIFICATION_EMAIL = OWNER
  process.env.SUPABASE_URL = 'https://project.supabase.co'
  process.env.SUPABASE_SECRET_KEY = 'test-service-role'
})

afterEach(() => {
  delete process.env.ADMIN_NOTIFICATION_EMAIL
  delete process.env.SUPABASE_URL
  delete process.env.SUPABASE_SECRET_KEY
})

const user = (email: string) => ({ data: { user: { id: 'user-1', email } }, error: null })

describe('requireAdmin', () => {
  it('accepts the owner, matching the address case-insensitively', async () => {
    getUser.mockResolvedValue(user('owner@droneconfidence.com.au'))
    const result = await call('Bearer valid-token')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.identity.email).toBe('owner@droneconfidence.com.au')
    expect(getUser).toHaveBeenCalledWith('valid-token')
  })

  it('refuses a valid Supabase user who is not the owner', async () => {
    getUser.mockResolvedValue(user('someone.else@example.com'))
    const result = await call('Bearer valid-token')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
  })

  it('refuses a request with no bearer token', async () => {
    const result = await call()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
    // Nothing is even asked of Supabase without a token.
    expect(getUser).not.toHaveBeenCalled()
  })

  it('refuses a token Supabase rejects', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid JWT' } })
    const result = await call('Bearer expired-token')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
  })

  it('refuses everything when the owner address is not configured', async () => {
    delete process.env.ADMIN_NOTIFICATION_EMAIL
    getUser.mockResolvedValue(user('owner@droneconfidence.com.au'))
    const result = await call('Bearer valid-token')
    // No owner configured means nobody to authorise, not an open door.
    expect(result.ok).toBe(false)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('refuses when Supabase itself is unreachable', async () => {
    getUser.mockRejectedValue(new Error('network down'))
    const result = await call('Bearer valid-token')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
      // The provider error never reaches the caller.
      const body = (await result.response.json()) as { message: string }
      expect(body.message).toBe('Not authorised.')
    }
  })

  it('says nothing about why authorisation failed', async () => {
    getUser.mockResolvedValue(user('someone.else@example.com'))
    const result = await call('Bearer valid-token')
    if (result.ok) throw new Error('expected refusal')
    const body = (await result.response.json()) as { message: string }
    expect(body.message).toBe('Not authorised.')
    expect(body.message).not.toContain('owner')
    expect(JSON.stringify(body)).not.toContain(OWNER)
  })
})
