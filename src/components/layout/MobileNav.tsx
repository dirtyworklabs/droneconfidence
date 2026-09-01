import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { primaryNav } from '@/components/layout/navigation'
import { BookingCta } from '@/components/booking/BookingCta'
import { Wordmark } from '@/components/layout/Wordmark'
import { calm } from '@/lib/motion'
import { cn } from '@/lib/cn'
import { formatPrice, lowestSessionPrice } from '@/content/sessions'

interface MobileNavProps {
  open: boolean
  onClose: () => void
  /** Focus returns here when the drawer closes. */
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

export const MobileNav = ({ open, onClose, triggerRef }: MobileNavProps) => {
  const reduced = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      )
      if (!focusable || focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  // Return focus to the menu button, but only when the drawer actually closes
  // — never on first mount.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (wasOpen.current && !open) {
      triggerRef.current?.focus({ preventScroll: true })
    }
    wasOpen.current = open
  }, [open, triggerRef])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 lg:hidden"
          initial={reduced ? undefined : { opacity: 0 }}
          animate={reduced ? undefined : { opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={calm(0.24)}
        >
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default bg-eucalyptus-deep/35 backdrop-blur-[2px]"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={reduced ? undefined : { opacity: 0, y: -12 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={calm(0.28)}
            className="absolute inset-x-3 top-3 overflow-hidden rounded-[var(--radius-panel)] border border-ink/8 bg-canvas shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-center justify-between border-b border-ink/8 px-5 py-4">
              <Wordmark />
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="grid size-11 place-items-center rounded-full border border-ink/10 bg-surface text-ink transition-colors duration-200 ease-[var(--ease-calm)] hover:border-sage/30 hover:text-sage"
              >
                <X aria-hidden="true" className="size-5" />
                <span className="sr-only">Close menu</span>
              </button>
            </div>

            <nav aria-label="Main" className="px-2 py-2">
              <ul className="flex flex-col">
                {primaryNav.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-13 items-center justify-between rounded-[var(--radius-control)] px-4 font-display text-[1.15rem] font-semibold tracking-[-0.02em] transition-colors duration-200 ease-[var(--ease-calm)]',
                          isActive ? 'bg-sage-soft text-eucalyptus' : 'text-ink hover:bg-sage-soft/60',
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
                <li>
                  <NavLink
                    to="/contact"
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-13 items-center rounded-[var(--radius-control)] px-4 font-display text-[1.15rem] font-semibold tracking-[-0.02em] transition-colors duration-200 ease-[var(--ease-calm)]',
                        isActive ? 'bg-sage-soft text-eucalyptus' : 'text-ink hover:bg-sage-soft/60',
                      )
                    }
                  >
                    Contact
                  </NavLink>
                </li>
              </ul>
            </nav>

            <div className="border-t border-ink/8 p-4">
              <BookingCta size="lg" fullWidth context="mobile-nav" withArrow>
                Book a Session
              </BookingCta>
              <p className="pt-3 text-center text-sm text-ink-muted">
                Sessions from {formatPrice(lowestSessionPrice)}
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
