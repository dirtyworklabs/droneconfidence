import { useCallback, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AdminNotice, AdminShell } from '@/components/admin/AdminShell'
import { AdminAvailabilityPanel } from '@/components/admin/AdminAvailabilityPanel'
import { AdminBookingsPanel } from '@/components/admin/AdminBookingsPanel'
import { AdminSettingsPanel } from '@/components/admin/AdminSettingsPanel'
import { useAdminSession } from '@/components/admin/useAdminSession'
import type { AdminRun } from '@/components/admin/types'
import { AdminAuthExpired } from '@/lib/adminApi'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/routes'
import { useSeo } from '@/lib/seo'

const TABS = [
  { value: 'bookings', label: 'Bookings' },
  { value: 'availability', label: 'Availability' },
  { value: 'settings', label: 'Settings' },
] as const

type Tab = (typeof TABS)[number]['value']

/**
 * The owner dashboard.
 *
 * Being able to load this page is not permission to see anything: it holds no
 * booking data of its own and every panel gets its data from an admin endpoint
 * that re-verifies the bearer token and matches the signed-in email against
 * `ADMIN_NOTIFICATION_EMAIL`. Hiding the route is presentation, not security.
 */
const Admin = () => {
  const { status, email, getToken, signOut } = useAdminSession()
  const [tab, setTab] = useState<Tab>('bookings')

  useSeo({
    title: 'Bookings | Drone Confidence',
    description: 'Owner booking dashboard.',
    path: ROUTES.admin,
    noIndex: true,
  })

  // Panels never hold a token. They ask for one per call, so a token refreshed
  // in the background is picked up and an expired session ends the session here.
  const run = useCallback<AdminRun>(
    async (fn) => {
      const token = await getToken()
      if (token === null) throw new AdminAuthExpired()
      try {
        return await fn(token)
      } catch (error) {
        if (error instanceof AdminAuthExpired) void signOut()
        throw error
      }
    },
    [getToken, signOut],
  )

  if (status === 'unconfigured') {
    return (
      <AdminShell>
        <AdminNotice tone="error">
          The dashboard is not configured for this deployment. Set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in the Netlify site environment, then redeploy.
        </AdminNotice>
      </AdminShell>
    )
  }

  if (status === 'loading') {
    return (
      <AdminShell>
        <p className="text-[0.95rem] text-ink-muted">Checking your session…</p>
      </AdminShell>
    )
  }

  if (status === 'signedOut') return <Navigate to={ROUTES.adminLogin} replace />

  return (
    <AdminShell identity={email} onSignOut={() => void signOut()}>
      <div className="flex flex-col gap-6">
        <nav aria-label="Dashboard sections" className="flex flex-wrap gap-1">
          {TABS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTab(option.value)}
              aria-current={tab === option.value ? 'page' : undefined}
              className={cn(
                'min-h-10 rounded-[var(--radius-control)] px-3.5 text-[0.9rem] font-medium transition-colors duration-200 ease-[var(--ease-calm)]',
                tab === option.value
                  ? 'bg-ink text-canvas'
                  : 'text-ink-soft hover:bg-ink/6 hover:text-ink',
              )}
            >
              {option.label}
            </button>
          ))}
        </nav>

        {tab === 'bookings' ? <AdminBookingsPanel run={run} /> : null}
        {tab === 'availability' ? <AdminAvailabilityPanel run={run} /> : null}
        {tab === 'settings' ? <AdminSettingsPanel run={run} /> : null}
      </div>
    </AdminShell>
  )
}

export default Admin
