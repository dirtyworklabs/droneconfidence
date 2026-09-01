import { motion, useReducedMotion } from 'motion/react'
import { EASE_CALM } from '@/lib/motion'
import { cn } from '@/lib/cn'
import type { FallbackTreatment } from '@/content/images'

/**
 * Designed fallbacks used wherever real photography has not been supplied.
 *
 * The motif is abstract and consistent: topographic contours, traced flight
 * paths, framing brackets, altitude and heading marks. No drone silhouettes,
 * no icon soup, nothing that pretends to be a photograph.
 */

const CONTOURS = [
  'M-20 190C60 150 140 214 250 176s180 20 300-24',
  'M-20 224C70 184 150 246 260 208s180 22 300-22',
  'M-20 258C80 218 160 278 270 240s180 24 300-20',
  'M-20 296C90 256 170 312 280 274s180 26 300-18',
  'M-20 338C100 298 180 350 290 312s180 28 300-16',
]

const Contours = ({ opacity = 0.5, stroke = 'currentColor' }: { opacity?: number; stroke?: string }) => (
  <g fill="none" stroke={stroke} strokeWidth={1} opacity={opacity}>
    {CONTOURS.map((d) => (
      <path key={d} d={d} />
    ))}
  </g>
)

const TracedPath = ({
  d,
  stroke,
  width = 2,
  dash,
  delay = 0.2,
}: {
  d: string
  stroke: string
  width?: number
  dash?: string
  delay?: number
}) => {
  const reduced = useReducedMotion()

  if (reduced) {
    return <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} />
  }

  return (
    <motion.path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={dash}
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{
        pathLength: { duration: 1.8, delay, ease: EASE_CALM },
        opacity: { duration: 0.4, delay },
      }}
    />
  )
}

/** Static. The traced path is the only movement in a treatment. */
const Marker = ({ cx, cy }: { cx: number; cy: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={13} fill="none" stroke="#B9DDE5" strokeWidth={1} opacity={0.6} />
    <circle cx={cx} cy={cy} r={5} fill="#E9DCC5" />
  </g>
)

const Frame = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('absolute inset-0', className)}>{children}</div>
)

const labelClass =
  'pointer-events-none absolute bottom-4 left-5 right-5 font-sans text-[0.66rem] uppercase tracking-[0.18em]'

/* ---------------------------------------------------------------- hero path */

const FlightPathTreatment = ({ caption }: { caption: string }) => (
  <Frame className="bg-eucalyptus text-sage">
    <svg viewBox="0 0 540 400" className="size-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="dc-hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d4f45" />
          <stop offset="1" stopColor="#0e2a25" />
        </linearGradient>
      </defs>
      <rect width="540" height="400" fill="url(#dc-hero-sky)" />
      <g stroke="#337667" strokeWidth="1" opacity="0.28">
        {[68, 136, 204, 272, 340, 408, 476].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="400" />
        ))}
      </g>
      <Contours opacity={0.55} stroke="#337667" />
      <TracedPath d="M-10 300C90 210 170 300 280 200s170-40 280-96" stroke="#B9DDE5" width={2.5} dash="7 10" />
      <Marker cx={280} cy={200} />
      <g stroke="#DDEBE6" strokeWidth="1" opacity="0.35">
        <line x1="280" y1="213" x2="280" y2="304" strokeDasharray="3 6" />
        <line x1="264" y1="304" x2="296" y2="304" />
      </g>
    </svg>
    <div className={cn(labelClass, 'text-sage-soft/70')}>
      <span>{caption}</span>
    </div>
  </Frame>
)

/* ------------------------------------------------------------- controller UI */

const ControllerTreatment = ({ caption }: { caption: string }) => (
  <Frame className="bg-sand-soft text-ink">
    <svg viewBox="0 0 540 400" className="size-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="540" height="400" fill="#f4ece0" />
      <g stroke="#101916" strokeWidth="1" opacity="0.07">
        {[0, 68, 136, 204, 272, 340, 408, 476].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="400" />
        ))}
        {[68, 136, 204, 272, 340].map((y) => (
          <line key={y} x1="0" y1={y} x2="540" y2={y} />
        ))}
      </g>
      <rect x="96" y="132" width="348" height="152" rx="26" fill="#ffffff" opacity="0.85" />
      <rect x="96" y="132" width="348" height="152" rx="26" fill="none" stroke="#163F37" strokeOpacity="0.14" />
      <g fill="none" stroke="#163F37" strokeOpacity="0.5">
        <circle cx="168" cy="208" r="38" />
        <circle cx="372" cy="208" r="38" />
      </g>
      <circle cx="168" cy="208" r="11" fill="#163F37" opacity="0.85" />
      <circle cx="372" cy="188" r="11" fill="#337667" opacity="0.9" />
      <g stroke="#163F37" strokeOpacity="0.3" strokeWidth="1">
        <line x1="130" y1="208" x2="206" y2="208" strokeDasharray="2 5" />
        <line x1="168" y1="170" x2="168" y2="246" strokeDasharray="2 5" />
        <line x1="334" y1="208" x2="410" y2="208" strokeDasharray="2 5" />
        <line x1="372" y1="170" x2="372" y2="246" strokeDasharray="2 5" />
      </g>
      <TracedPath d="M52 322C150 300 190 344 270 322s180 8 250-28" stroke="#337667" width={1.6} delay={0.3} />
    </svg>
    <div className={cn(labelClass, 'text-ink-muted')}>
      <span>{caption}</span>
    </div>
  </Frame>
)

/* -------------------------------------------------------------------- orbit */

const OrbitTreatment = ({ caption }: { caption: string }) => (
  <Frame className="bg-sky-soft text-ink">
    <svg viewBox="0 0 540 400" className="size-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="540" height="400" fill="#e4f1f4" />
      <Contours opacity={0.22} stroke="#163F37" />
      <g fill="none" stroke="#163F37" strokeOpacity="0.16">
        <circle cx="270" cy="204" r="132" />
        <circle cx="270" cy="204" r="86" />
      </g>
      <TracedPath d="M270 72a132 132 0 1 1-0.1 0" stroke="#337667" width={2} dash="8 10" delay={0.25} />
      <circle cx="270" cy="204" r="4" fill="#163F37" />
      <Marker cx={402} cy={204} />
      <g stroke="#163F37" strokeOpacity="0.3" strokeWidth="1">
        <line x1="270" y1="204" x2="402" y2="204" strokeDasharray="3 6" />
      </g>
    </svg>
    <div className={cn(labelClass, 'text-ink-muted')}>
      <span>{caption}</span>
    </div>
  </Frame>
)

/* ------------------------------------------------------------------ framing */

const FramingTreatment = ({ caption }: { caption: string }) => (
  <Frame className="bg-eucalyptus-deep text-sage-soft">
    <svg viewBox="0 0 540 400" className="size-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="dc-frame-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#163F37" />
          <stop offset="1" stopColor="#0e2a25" />
        </linearGradient>
      </defs>
      <rect width="540" height="400" fill="url(#dc-frame-bg)" />
      <path d="M0 268C120 236 200 292 320 258s160 6 220-26v168H0z" fill="#337667" opacity="0.35" />
      <path d="M0 310C130 282 210 330 330 302s150 6 210-20v118H0z" fill="#337667" opacity="0.28" />
      <g stroke="#DDEBE6" strokeOpacity="0.22" strokeWidth="1">
        <line x1="180" y1="60" x2="180" y2="340" />
        <line x1="360" y1="60" x2="360" y2="340" />
        <line x1="60" y1="153" x2="480" y2="153" />
        <line x1="60" y1="247" x2="480" y2="247" />
      </g>
      <g fill="none" stroke="#E9DCC5" strokeWidth="2" strokeOpacity="0.9">
        <path d="M60 96V60h40" />
        <path d="M440 60h40v36" />
        <path d="M480 304v36h-40" />
        <path d="M100 340H60v-36" />
      </g>
      <circle cx="360" cy="153" r="5" fill="#E9DCC5" />
    </svg>
    <div className={cn(labelClass, 'text-sage-soft/70')}>
      <span>{caption}</span>
    </div>
  </Frame>
)

/* --------------------------------------------------------------- topography */

const TopographyTreatment = ({ caption }: { caption: string }) => (
  <Frame className="bg-sage-soft text-ink">
    <svg viewBox="0 0 540 400" className="size-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="540" height="400" fill="#ddebe6" />
      <g fill="none" stroke="#163F37" strokeOpacity="0.18" strokeWidth="1">
        <path d="M-20 120C80 84 160 148 270 112s180 22 300-18" />
        <path d="M-20 162C90 126 170 190 280 154s180 24 300-16" />
        <path d="M-20 206C100 170 180 234 290 198s180 26 300-14" />
        <path d="M-20 252C110 216 190 278 300 242s180 28 300-12" />
        <path d="M-20 300C120 264 200 324 310 288s180 30 300-10" />
        <path d="M-20 350C130 314 210 372 320 336s180 32 300-8" />
      </g>
      <g stroke="#337667" strokeOpacity="0.22" strokeWidth="1">
        {[68, 204, 340, 476].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="400" />
        ))}
      </g>
      <g fill="none" stroke="#163F37" strokeOpacity="0.45">
        <circle cx="272" cy="196" r="30" strokeDasharray="4 6" />
      </g>
      <circle cx="272" cy="196" r="6" fill="#163F37" />
      <g stroke="#163F37" strokeOpacity="0.45" strokeWidth="1.5">
        <line x1="272" y1="152" x2="272" y2="164" />
        <line x1="272" y1="228" x2="272" y2="240" />
        <line x1="228" y1="196" x2="240" y2="196" />
        <line x1="304" y1="196" x2="316" y2="196" />
      </g>
    </svg>
    <div className={cn(labelClass, 'text-ink-soft/70')}>
      <span>{caption}</span>
    </div>
  </Frame>
)

/* --------------------------------------------------------------- credential */

/**
 * Stands in for the founder portrait. Deliberately typographic rather than a
 * generic silhouette: it states the one fact the section is about and carries
 * the same contour-and-flight-path motif as every other treatment, so a real
 * photograph can replace it later without changing anything around it.
 */
const CredentialTreatment = ({ caption }: { caption: string }) => (
  <Frame className="bg-sand text-eucalyptus-deep">
    <svg viewBox="0 0 420 520" className="size-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="420" height="520" fill="#e9dcc5" />
      <g stroke="#163F37" strokeOpacity="0.07" strokeWidth="1">
        {[70, 140, 210, 280, 350].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="520" />
        ))}
      </g>
      <g fill="none" stroke="#163F37" strokeOpacity="0.16" strokeWidth="1">
        <path d="M-20 330C60 294 140 354 250 318s140 20 220-16" />
        <path d="M-20 378C70 342 150 400 260 364s130 22 210-14" />
        <path d="M-20 428C80 392 160 448 270 412s120 24 200-12" />
        <path d="M-20 480C90 444 170 498 280 462s110 26 190-10" />
      </g>
      <TracedPath
        d="M-10 300C70 244 130 296 210 240s130-34 230-78"
        stroke="#337667"
        width={1.8}
        dash="7 10"
        delay={0.3}
      />
      <circle cx="210" cy="240" r="16" fill="none" stroke="#163F37" strokeOpacity="0.3" />
      <circle cx="210" cy="240" r="5" fill="#163F37" opacity="0.55" />
    </svg>

    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 sm:p-8">
      <p className="max-w-[15ch] font-display text-[clamp(1.45rem,2.6vw,1.85rem)] font-bold leading-[1.1] tracking-[-0.03em]">
        Working with drones since 2014
      </p>
      <p className="font-sans text-[0.66rem] uppercase tracking-[0.18em] text-eucalyptus-deep/60">
        {caption}
      </p>
    </div>
  </Frame>
)

const registry: Record<FallbackTreatment, (props: { caption: string }) => React.ReactElement> = {
  'flight-path': FlightPathTreatment,
  controller: ControllerTreatment,
  orbit: OrbitTreatment,
  framing: FramingTreatment,
  topography: TopographyTreatment,
  credential: CredentialTreatment,
}

export const Treatment = ({ variant, caption }: { variant: FallbackTreatment; caption: string }) => {
  const Component = registry[variant]
  return <Component caption={caption} />
}
