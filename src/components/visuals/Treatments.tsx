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

const FlightPathTreatment = ({ caption }: { caption: string }) => {
  const reduced = useReducedMotion()

  const flightRoute =
    'M62 390 C112 352 116 286 174 268 C232 250 232 196 286 184 C344 170 354 120 422 98'

  const groundRoute =
    'M62 448 C118 432 138 398 190 388 C250 376 280 346 328 332 C374 318 400 294 438 278'

  return (
    <Frame className="bg-eucalyptus text-sage">
      <svg
        viewBox="0 0 460 560"
        className="size-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="dc-flight-bg" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor="#1d5147" />
            <stop offset="0.55" stopColor="#163f37" />
            <stop offset="1" stopColor="#0b2520" />
          </linearGradient>

          <radialGradient id="dc-flight-glow" cx="50%" cy="32%" r="62%">
            <stop offset="0" stopColor="#B9DDE5" stopOpacity="0.12" />
            <stop offset="1" stopColor="#B9DDE5" stopOpacity="0" />
          </radialGradient>

          <filter id="dc-flight-marker-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="dc-flight-soft-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" />
          </filter>

          <path id="dc-flight-route" d={flightRoute} />
          <path id="dc-ground-route" d={groundRoute} />
        </defs>

        {/* Background */}
        <rect width="460" height="560" fill="url(#dc-flight-bg)" />
        <rect width="460" height="560" fill="url(#dc-flight-glow)" />

        {/* Distant horizon */}
        <path
          d="M0 176 C110 160 222 168 460 140"
          fill="none"
          stroke="#B9DDE5"
          strokeWidth="1"
          strokeOpacity="0.09"
        />

        <path
          d="M0 191 C126 174 264 184 460 158"
          fill="none"
          stroke="#B9DDE5"
          strokeWidth="1"
          strokeOpacity="0.055"
        />

        {/* Perspective floor */}
        <g
          fill="none"
          stroke="#70a99b"
          strokeWidth="1"
          strokeOpacity="0.15"
        >
          {/* Converging depth lines */}
          {[-70, 10, 90, 170, 250, 330, 410, 490, 570].map((x) => (
            <line key={x} x1="278" y1="150" x2={x} y2="590" />
          ))}

          {/* Perspective cross-lines */}
          <path d="M236 184 L321 184" />
          <path d="M210 216 L346 216" />
          <path d="M176 258 L379 258" />
          <path d="M136 309 L415 309" />
          <path d="M90 372 L455 372" />
          <path d="M28 448 L515 448" />
          <path d="M-48 538 L596 538" />
        </g>

        {/* Very subtle moving scan plane */}
        {!reduced && (
          <motion.g
            animate={{
              opacity: [0.08, 0.2, 0.08],
              y: [0, 5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <path
              d="M120 330 L278 160 L432 330"
              fill="#B9DDE5"
              fillOpacity="0.04"
            />
          </motion.g>
        )}

        {/* Ground track */}
        {reduced ? (
          <path
            d={groundRoute}
            fill="none"
            stroke="#70a99b"
            strokeWidth="1.4"
            strokeOpacity="0.42"
            strokeDasharray="5 9"
          />
        ) : (
          <motion.path
            d={groundRoute}
            fill="none"
            stroke="#70a99b"
            strokeWidth="1.4"
            strokeOpacity="0.42"
            strokeDasharray="5 9"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.42 }}
            transition={{
              pathLength: {
                duration: 2.4,
                delay: 0.55,
                ease: EASE_CALM,
              },
              opacity: {
                duration: 0.4,
                delay: 0.55,
              },
            }}
          />
        )}

        {/* Altitude/depth projections */}
        <g
          stroke="#B9DDE5"
          strokeWidth="1"
          strokeOpacity="0.26"
          strokeDasharray="3 6"
        >
          <line x1="174" y1="268" x2="190" y2="388" />
          <line x1="286" y1="184" x2="328" y2="332" />
          <line x1="422" y1="98" x2="438" y2="278" />
        </g>

        {/* Ground contact / projected points */}
        <g fill="#70a99b" fillOpacity="0.55">
          <circle cx="190" cy="388" r="3" />
          <circle cx="328" cy="332" r="3" />
          <circle cx="438" cy="278" r="3" />
        </g>

        {/* Main 3D flight path */}
        {reduced ? (
          <path
            d={flightRoute}
            fill="none"
            stroke="#DDEBE6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ) : (
          <>
            <motion.path
              d={flightRoute}
              fill="none"
              stroke="#B9DDE5"
              strokeWidth="8"
              strokeOpacity="0.08"
              strokeLinecap="round"
              filter="url(#dc-flight-soft-glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 2.5,
                delay: 0.42,
                ease: EASE_CALM,
              }}
            />

            <motion.path
              d={flightRoute}
              fill="none"
              stroke="#DDEBE6"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: {
                  duration: 2.5,
                  delay: 0.42,
                  ease: EASE_CALM,
                },
                opacity: {
                  duration: 0.4,
                  delay: 0.42,
                },
              }}
            />
          </>
        )}

        {/* Waypoints */}
        {[
          { x: 174, y: 268 },
          { x: 286, y: 184 },
          { x: 422, y: 98 },
        ].map((point, index) => (
          <g key={`${point.x}-${point.y}`}>
            {!reduced && (
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="14"
                fill="none"
                stroke="#B9DDE5"
                strokeWidth="1"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity: [0.18, 0.45, 0.18],
                  scale: [0.9, 1.12, 0.9],
                }}
                transition={{
                  delay: 1 + index * 0.22,
                  duration: 3.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  transformOrigin: `${point.x}px ${point.y}px`,
                }}
              />
            )}

            <circle
              cx={point.x}
              cy={point.y}
              r="3.5"
              fill="#E9DCC5"
            />
          </g>
        ))}

        {/* Moving ground shadow */}
        {reduced ? (
          <ellipse
            cx="328"
            cy="332"
            rx="10"
            ry="4"
            fill="#061713"
            fillOpacity="0.34"
          />
        ) : (
          <g opacity="0.48">
            <ellipse
              cx="0"
              cy="0"
              rx="10"
              ry="4"
              fill="#061713"
            />
            <animateMotion
              dur="9s"
              repeatCount="indefinite"
              rotate="auto"
            >
              <mpath href="#dc-ground-route" />
            </animateMotion>
          </g>
        )}

        {/* Aircraft tracker */}
        {reduced ? (
          <g transform="translate(286 184)">
            <circle
              r="13"
              fill="#163F37"
              stroke="#DDEBE6"
              strokeWidth="1"
            />
            <circle r="3.5" fill="#E9DCC5" />
            <path
              d="M-10 -10 L10 10 M10 -10 L-10 10"
              stroke="#DDEBE6"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="-10" cy="-10" r="2.5" fill="none" stroke="#B9DDE5" />
            <circle cx="10" cy="-10" r="2.5" fill="none" stroke="#B9DDE5" />
            <circle cx="-10" cy="10" r="2.5" fill="none" stroke="#B9DDE5" />
            <circle cx="10" cy="10" r="2.5" fill="none" stroke="#B9DDE5" />
          </g>
        ) : (
          <g filter="url(#dc-flight-marker-glow)">
            <circle
              r="13"
              fill="#163F37"
              stroke="#DDEBE6"
              strokeWidth="1"
            />
            <circle r="3.5" fill="#E9DCC5" />

            <path
              d="M-10 -10 L10 10 M10 -10 L-10 10"
              stroke="#DDEBE6"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            <circle cx="-10" cy="-10" r="2.5" fill="none" stroke="#B9DDE5" />
            <circle cx="10" cy="-10" r="2.5" fill="none" stroke="#B9DDE5" />
            <circle cx="-10" cy="10" r="2.5" fill="none" stroke="#B9DDE5" />
            <circle cx="10" cy="10" r="2.5" fill="none" stroke="#B9DDE5" />

            <animateMotion
              dur="9s"
              repeatCount="indefinite"
              rotate="auto"
            >
              <mpath href="#dc-flight-route" />
            </animateMotion>
          </g>
        )}

        {/* Tracker brackets */}
        <g
          fill="none"
          stroke="#DDEBE6"
          strokeWidth="1"
          strokeOpacity="0.28"
        >
          <path d="M34 54 V34 H54" />
          <path d="M406 34 H426 V54" />
          <path d="M426 486 V506 H406" />
          <path d="M54 506 H34 V486" />
        </g>

        {/* Minimal axis language */}
        <g
          fill="#B9DDE5"
          fillOpacity="0.54"
          fontSize="9"
          fontFamily="Inter, sans-serif"
          letterSpacing="1.6"
        >
        </g>
      </svg>

      <div className={cn(labelClass, 'text-sage-soft/70')}>
        <span>{caption}</span>
      </div>
    </Frame>
  )
}

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
