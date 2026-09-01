import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Wordmark } from '@/components/layout/Wordmark'
import { primaryNav } from '@/components/layout/navigation'
import { MobileNav } from '@/components/layout/MobileNav'
import { BookingCta } from '@/components/booking/BookingCta'
import { cn } from '@/lib/cn'

export const Header = () => {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ease-[var(--ease-calm)]',
        scrolled
          ? 'border-b border-ink/8 bg-canvas/85 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/72'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <Container
        gutter="tight"
        className="flex h-16 items-center justify-between gap-2 min-[400px]:gap-3 sm:h-18 sm:gap-4 lg:gap-6"
      >
        <Link
          to="/"
          className="min-w-0 rounded-[var(--radius-control)] py-2 transition-opacity duration-200 ease-[var(--ease-calm)] hover:opacity-80"
        >
          <Wordmark />
          <span className="sr-only">— home</span>
        </Link>

        <nav aria-label="Main" className="hidden shrink-0 lg:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'relative inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-3.5 text-[0.95rem] font-medium transition-colors duration-200 ease-[var(--ease-calm)]',
                      isActive ? 'text-eucalyptus' : 'text-ink-soft hover:text-eucalyptus',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute inset-x-3.5 bottom-1.5 h-px origin-left bg-sage transition-transform duration-200 ease-[var(--ease-calm)]',
                          isActive ? 'scale-x-100' : 'scale-x-0',
                        )}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <BookingCta size="compact" context="header">
            Book a Session
          </BookingCta>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] border border-ink/10 bg-surface/70 text-ink transition-colors duration-200 ease-[var(--ease-calm)] hover:border-sage/30 hover:text-sage sm:size-11 lg:hidden"
          >
            <Menu aria-hidden="true" className="size-5" />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </Container>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} triggerRef={menuButtonRef} />
    </header>
  )
}
