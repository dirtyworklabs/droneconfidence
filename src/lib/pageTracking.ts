/**
 * One `page_viewed` per navigation.
 *
 * Fired at the routing level rather than inside a page component, so a
 * re-render, a Suspense fallback swap or React's development double-invoke
 * cannot produce a second event for the same navigation. A later navigation
 * back to a page legitimately counts again.
 *
 * Only the pathname is involved. A change of query string — choosing a session
 * on /book, or arriving on /booking-confirmed with a Stripe session id — is not
 * a new page view and is never transmitted.
 */

import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { isTrackablePath } from '@shared/analytics/events'
import { track } from '@/lib/analytics'

export const usePageTracking = (): void => {
  const { pathname } = useLocation()
  const lastTracked = useRef<string | null>(null)

  useEffect(() => {
    if (lastTracked.current === pathname) return
    lastTracked.current = pathname
    // /admin and /admin/login are owner surfaces, not measured ones.
    if (!isTrackablePath(pathname)) return
    track('page_viewed')
  }, [pathname])
}
