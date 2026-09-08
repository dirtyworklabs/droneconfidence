import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChevronLeft, ChevronRight, Maximize2, Pause, Play, X } from 'lucide-react'
import { aboutGalleryImages } from '@/content/aboutGallery'
import { calm } from '@/lib/motion'
import { cn } from '@/lib/cn'

/** One photograph roughly every six and a half seconds — calm, not restless. */
const AUTOPLAY_MS = 6500

const GALLERY_LABEL = 'Drone operations photo gallery'

const total = aboutGalleryImages.length

const pad = (value: number) => String(value).padStart(2, '0')

const counter = (index: number) => `${pad(index + 1)} / ${pad(total)}`

/** Quiet translucent control that reads on any photograph. */
const controlClass =
  'grid size-11 place-items-center rounded-full border border-white/20 bg-eucalyptus-deep/55 text-canvas backdrop-blur-[6px] transition-[background-color,border-color,opacity] duration-200 ease-[var(--ease-calm)] hover:border-white/35 hover:bg-eucalyptus-deep/80 focus-visible:outline-2 focus-visible:outline-canvas focus-visible:outline-offset-2'

const chipClass =
  'rounded-full border border-white/15 bg-eucalyptus-deep/55 px-3 py-1 font-display text-[0.75rem] font-semibold tabular-nums tracking-[0.1em] text-canvas backdrop-blur-[6px]'

/**
 * Editorial photo gallery for the About page.
 *
 * Sits inside the existing sticky left column and keeps a fixed 4:3 frame, so
 * changing photograph never moves the page. Autoplay is a single timeout that
 * restarts on every index change, and it only runs when the reader is not
 * interacting, the tab is visible, the lightbox is closed and reduced motion
 * is off.
 */
export const AboutGallery = () => {
  const reduced = useReducedMotion() ?? false

  const [index, setIndex] = useState(0)
  const [userPaused, setUserPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const [tabHidden, setTabHidden] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  // Only manual moves are announced — a six-second cycle should stay silent.
  const [liveMessage, setLiveMessage] = useState('')

  const expandRef = useRef<HTMLButtonElement>(null)

  const image = aboutGalleryImages[index]

  const move = useCallback(
    (delta: number) => {
      const next = (index + delta + total) % total
      setIndex(next)
      setLiveMessage(`Photograph ${next + 1} of ${total}. ${aboutGalleryImages[next].alt}`)
    },
    [index],
  )

  const showPrevious = useCallback(() => move(-1), [move])
  const showNext = useCallback(() => move(1), [move])

  const autoplayRunning =
    !reduced && !userPaused && !hovered && !focusWithin && !tabHidden && !lightboxOpen

  // A single timeout, re-armed by every index change (so manual navigation
  // resets the countdown) and torn down on unmount or any pause condition.
  useEffect(() => {
    if (!autoplayRunning) return

    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % total)
      setLiveMessage('')
    }, AUTOPLAY_MS)

    return () => window.clearTimeout(timer)
  }, [autoplayRunning, index])

  useEffect(() => {
    const onVisibilityChange = () => setTabHidden(document.hidden)
    onVisibilityChange()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  // Warm only the next photograph, so a crossfade never lands on a blank frame.
  useEffect(() => {
    const next = aboutGalleryImages[(index + 1) % total]
    const preload = new Image()
    preload.src = next.src
  }, [index])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
    expandRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div
      className="group/gallery relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocusWithin(true)}
      onBlur={() => setFocusWithin(false)}
    >
      <div className="relative isolate aspect-[4/3] overflow-hidden rounded-[var(--radius-panel)] border border-ink/8 bg-canvas-deep">
        <AnimatePresence initial={false}>
          <motion.img
            key={image.src}
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding={index === 0 ? 'sync' : 'async'}
            fetchPriority={index === 0 ? 'high' : 'auto'}
            style={{ objectPosition: image.objectPosition }}
            className="absolute inset-0 size-full object-cover"
            initial={reduced ? undefined : { opacity: 0, scale: 1.02 }}
            animate={reduced ? undefined : { opacity: 1, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={calm(0.4)}
          />
        </AnimatePresence>

        {/*
          Pointer affordance only. The labelled Expand button below is the
          keyboard and screen-reader route, so this adds no duplicate tab stop.
        */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setLightboxOpen(true)}
          className="absolute inset-0 z-10 size-full cursor-zoom-in"
        />

        <div className="pointer-events-none absolute inset-0 z-20 opacity-90 transition-opacity duration-200 ease-[var(--ease-calm)] group-hover/gallery:opacity-100 group-focus-within/gallery:opacity-100">
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Previous photograph"
            className={cn(controlClass, 'pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2')}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>

          <button
            type="button"
            onClick={showNext}
            aria-label="Next photograph"
            className={cn(controlClass, 'pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2')}
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>

          <button
            ref={expandRef}
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="View photographs full screen"
            className={cn(controlClass, 'pointer-events-auto absolute right-3 top-3')}
          >
            <Maximize2 aria-hidden="true" className="size-[1.05rem]" />
          </button>

          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3">
            <span className={chipClass} aria-hidden="true">
              {counter(index)}
            </span>

            {reduced ? null : (
              <button
                type="button"
                onClick={() => setUserPaused((paused) => !paused)}
                aria-label={userPaused ? 'Play the photo gallery' : 'Pause the photo gallery'}
                className={cn(controlClass, 'pointer-events-auto')}
              >
                {userPaused ? (
                  <Play aria-hidden="true" className="size-[1.05rem]" />
                ) : (
                  <Pause aria-hidden="true" className="size-[1.05rem]" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {liveMessage}
      </p>

      {lightboxOpen ? (
        <Lightbox
          index={index}
          reduced={reduced}
          onPrevious={showPrevious}
          onNext={showNext}
          onClose={closeLightbox}
        />
      ) : null}
    </div>
  )
}

interface LightboxProps {
  index: number
  reduced: boolean
  onPrevious: () => void
  onNext: () => void
  onClose: () => void
}

/**
 * Full-viewport viewer. Rendered into `document.body` so no positioned or
 * transformed ancestor on the About page can trap it, and shows the whole
 * frame with `object-contain` rather than the 4:3 preview crop.
 */
const Lightbox = ({ index, reduced, onPrevious, onNext, onClose }: LightboxProps) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const image = aboutGalleryImages[index]

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus({ preventScroll: true })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onPrevious()
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        onNext()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])')
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
  }, [onClose, onNext, onPrevious])

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[60] bg-eucalyptus-deep/95"
      initial={reduced ? undefined : { opacity: 0 }}
      animate={reduced ? undefined : { opacity: 1 }}
      transition={calm(0.24)}
    >
      {/* Backdrop: closes on click, but never steals a tab stop. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 size-full cursor-default"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={GALLERY_LABEL}
        className="pointer-events-none relative flex h-full flex-col gap-4 p-4 [--pad:1rem] sm:gap-6 sm:p-8 sm:[--pad:2rem]"
        style={{
          paddingTop: 'max(var(--pad), env(safe-area-inset-top))',
          paddingBottom: 'max(var(--pad), env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex justify-end">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close the full screen photo gallery"
            className={cn(controlClass, 'pointer-events-auto')}
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <AnimatePresence initial={false}>
            <motion.img
              key={image.src}
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              decoding="async"
              style={{
                maxWidth: `min(100%, ${image.width}px)`,
                maxHeight: `min(100%, ${image.height}px)`,
              }}
              className="pointer-events-auto absolute inset-0 m-auto rounded-[var(--radius-card)] object-contain"
              initial={reduced ? undefined : { opacity: 0 }}
              animate={reduced ? undefined : { opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={calm(0.28)}
            />
          </AnimatePresence>
        </div>

        <div className="pointer-events-auto flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={onPrevious}
            aria-label="Previous photograph"
            className={controlClass}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>

          <span className={chipClass}>
            <span className="sr-only">Photograph {index + 1} of {total}</span>
            <span aria-hidden="true">{counter(index)}</span>
          </span>

          <button type="button" onClick={onNext} aria-label="Next photograph" className={controlClass}>
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>
    </motion.div>,
    document.body,
  )
}
