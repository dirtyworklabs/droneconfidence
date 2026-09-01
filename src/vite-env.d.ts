/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public booking URLs. Optional — the site builds and runs without any of them. */
  readonly VITE_BOOKING_ENABLED?: string
  readonly VITE_BOOKING_PROVIDER?: string
  readonly VITE_BOOKING_DISPLAY_MODE?: string
  readonly VITE_BOOKING_URL?: string
  readonly VITE_BOOKING_FIRST_FLIGHT_URL?: string
  readonly VITE_BOOKING_FLY_CONFIDENCE_URL?: string
  readonly VITE_BOOKING_PHOTO_VIDEO_URL?: string
  readonly VITE_BOOKING_EMBED_URL?: string
  readonly VITE_BOOKING_OPEN_IN_NEW_TAB?: string
  /** Public site details. */
  readonly VITE_SITE_URL?: string
  readonly VITE_CONTACT_EMAIL?: string
  readonly VITE_CONTACT_PHONE?: string
  readonly VITE_INSTAGRAM_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
