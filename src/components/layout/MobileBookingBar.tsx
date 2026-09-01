import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { BookingCta } from '@/components/booking/BookingCta'
import { calm } from '@/lib/motion'
import { formatPrice, lowestSessionPrice } from '@/content/sessions'

/** Routes that already lead with a booking or enquiry action. */
const SUPPRESSED_ROUTES = ['/book', '/contact']

/**
 * Small-screen booking bar. It only appears once the hero has scrolled away,
 * sits above a matching spacer so it never permanently covers content, and
 * stays out of the way on pages that are already an action.
 */
export const MobileBookingBar = () => {
  const [visible, setVisible] = useState(false)
  const reduced = useReducedMotion()
  const { pathname } = useLocation()

  const suppressed = SUPPRESSED_ROUTES.includes(pathname)

  useEffect(() => {
    if (suppressed) {
      setVisible(false)
      return
    }

    const onScroll = () => setVisible(window.scrollY > 560)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [suppressed])

  return (
    <>
      <div aria-hidden="true" className={visible ? 'h-20 sm:hidden' : 'hidden'} />
      <AnimatePresence>
        {visible ? (
          <motion.div
            initial={reduced ? undefined : { y: 72, opacity: 0 }}
            animate={reduced ? undefined : { y: 0, opacity: 1 }}
            exit={reduced ? undefined : { y: 72, opacity: 0 }}
            transition={calm(0.3)}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/8 bg-canvas/92 px-4 py-3 backdrop-blur-md sm:hidden"
          >
            <div className="flex items-center gap-3">
              <p className="flex-1 text-sm leading-tight text-ink-soft">
                Private sessions
                <br />
                <span className="font-display font-semibold text-ink">
                  from {formatPrice(lowestSessionPrice)}
                </span>
              </p>
              <BookingCta size="lg" context="mobile-sticky-bar">
                Book a Session
              </BookingCta>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
