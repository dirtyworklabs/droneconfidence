import { useCallback, useEffect, useState } from 'react'
import { adminAuthConfigured, getSupabaseClient } from '@/lib/supabaseClient'

export type AdminSessionStatus = 'unconfigured' | 'loading' | 'signedOut' | 'signedIn'

export interface AdminSession {
  status: AdminSessionStatus
  email: string | null
  /** A currently valid access token, refreshed by the client when needed. */
  getToken: () => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

/**
 * The owner's Supabase Auth session.
 *
 * Being signed in here is not authorisation — it only produces a token. Every
 * admin endpoint re-verifies that token and checks the email against
 * `ADMIN_NOTIFICATION_EMAIL` server-side, so a signed-in account that isn't the
 * owner can read nothing.
 *
 * The token is never cached in component state: `getToken()` asks the client for
 * the current session each time, so a silently refreshed token is picked up and
 * an expired one is never sent.
 */
export const useAdminSession = (): AdminSession => {
  const client = getSupabaseClient()
  const [status, setStatus] = useState<AdminSessionStatus>(
    adminAuthConfigured ? 'loading' : 'unconfigured',
  )
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!client) return
    let active = true

    void client.auth.getSession().then(({ data }) => {
      if (!active) return
      setEmail(data.session?.user.email ?? null)
      setStatus(data.session ? 'signedIn' : 'signedOut')
    })

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null)
      setStatus(session ? 'signedIn' : 'signedOut')
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [client])

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!client) return null
    const { data } = await client.auth.getSession()
    return data.session?.access_token ?? null
  }, [client])

  /** Resolves to an error message the owner can read, or null on success. */
  const signIn = useCallback(
    async (address: string, password: string): Promise<string | null> => {
      if (!client) return 'The dashboard is not configured for this deployment.'
      const { error } = await client.auth.signInWithPassword({
        email: address.trim(),
        password,
      })
      // Deliberately generic: never reveal whether the address exists.
      if (error) return 'That email address and password combination was not accepted.'
      return null
    },
    [client],
  )

  const signOut = useCallback(async () => {
    await client?.auth.signOut()
  }, [client])

  return { status, email, getToken, signIn, signOut }
}
