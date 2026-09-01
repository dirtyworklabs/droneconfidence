import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/forms/Fields'
import { AdminNotice, AdminShell } from '@/components/admin/AdminShell'
import { useAdminSession } from '@/components/admin/useAdminSession'
import { ROUTES } from '@/lib/routes'
import { useSeo } from '@/lib/seo'

/**
 * The single owner login.
 *
 * Signing in only obtains a token. Authorisation happens on the server, where
 * every admin function checks the token and matches the email against
 * `ADMIN_NOTIFICATION_EMAIL`, so this form is not the security boundary — it is
 * just the door. Failures are reported generically so the form can't be used to
 * discover whether an address has an account.
 */
const AdminLogin = () => {
  const navigate = useNavigate()
  const { status, signIn } = useAdminSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useSeo({
    title: 'Sign in | Drone Confidence',
    description: 'Owner sign-in.',
    path: ROUTES.adminLogin,
    noIndex: true,
  })

  useEffect(() => {
    if (status === 'signedIn') navigate(ROUTES.admin, { replace: true })
  }, [status, navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setProblem(null)
    const message = await signIn(email, password)
    setBusy(false)
    if (message) setProblem(message)
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-[26rem]">
        <h1 className="font-display text-[1.6rem] font-semibold tracking-[-0.025em]">Sign in</h1>

        {status === 'unconfigured' ? (
          <div className="mt-5">
            <AdminNotice tone="error">
              The dashboard is not configured for this deployment. Set{' '}
              <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in the
              Netlify site environment, then redeploy.
            </AdminNotice>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
            <TextField
              id="admin-email"
              name="email"
              type="email"
              label="Email"
              value={email}
              onChange={setEmail}
              autoComplete="username"
            />
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-password"
                className="font-display text-[0.95rem] font-semibold tracking-[-0.01em]"
              >
                Password
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="w-full min-h-12 rounded-[var(--radius-control)] border border-ink/12 bg-surface px-4 py-3 text-[1rem] text-ink transition-[border-color,box-shadow] duration-200 ease-[var(--ease-calm)] hover:border-ink/20 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25"
              />
            </div>

            {problem ? <AdminNotice tone="error">{problem}</AdminNotice> : null}

            <div>
              <Button type="submit" disabled={busy || status === 'loading'}>
                {busy ? 'Signing in…' : 'Sign in'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AdminShell>
  )
}

export default AdminLogin
