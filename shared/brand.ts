/**
 * The official Drone Confidence brand assets — the one place their paths,
 * intrinsic sizes and colours are written down.
 *
 * Shared by the browser, the email renderer and the build scripts' JSON-LD, so
 * no component retypes a logo path. Master files live in `brand/source/`; the
 * files below are web exports of them in `public/`. Paths are root-relative;
 * use `brandAssetUrl()` where an absolute URL is required (emails, JSON-LD).
 */

export interface BrandImage {
  src: string
  width: number
  height: number
}

export const BRAND_LOGOS = {
  /** Full lock-up for wide spaces: header, mobile menu, footer, admin. */
  horizontal: {
    onLight: { src: '/brand/drone-confidence-logo-horizontal-green.png', width: 1200, height: 282 },
    onDark: { src: '/brand/drone-confidence-logo-horizontal-white.png', width: 1200, height: 282 },
  },
  /** Centred lock-up: emails and centred compositions. */
  stacked: {
    onLight: { src: '/brand/drone-confidence-logo-stacked-green.png', width: 960, height: 599 },
    onDark: { src: '/brand/drone-confidence-logo-stacked-white.png', width: 960, height: 599 },
  },
} as const satisfies Record<string, Record<'onLight' | 'onDark', BrandImage>>

/**
 * The standalone app icon (rounded tile). Used wherever only a compact symbol
 * fits — the narrowest header, the loading screen — and as the device icon.
 */
export const BRAND_ICON: BrandImage = { src: '/icon-192.png', width: 192, height: 192 }
export const BRAND_ICON_LARGE: BrandImage = { src: '/icon-512.png', width: 512, height: 512 }

/** The 1200×630 social preview. */
export const BRAND_SOCIAL_CARD: BrandImage = { src: '/social-card.png', width: 1200, height: 630 }

/** Colours sampled from the supplied artwork. */
export const BRAND_COLORS = {
  forest: '#11442d',
  mint: '#8cc7b0',
} as const

export const BRAND_SITE_URL = 'https://droneconfidence.com'

export const brandAssetUrl = (path: string, siteUrl: string = BRAND_SITE_URL): string =>
  `${siteUrl.replace(/\/+$/, '')}${path}`
