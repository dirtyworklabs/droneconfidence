import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

/** Resets scroll position on navigation, ignoring in-page hash links. */
const ScrollReset = () => {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])

  return null
}

export const Layout = () => (
  <>
    <ScrollReset />
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:rounded-[var(--radius-control)] focus:bg-eucalyptus focus:px-4 focus:py-3 focus:text-canvas"
    >
      Skip to content
    </a>
    <Header />
    <main id="main">
      <Outlet />
    </main>
    <Footer />
  </>
)
