/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Supabase Auth for the owner login at /admin only. Both are optional: when
   * they are absent the site still builds, the public pages are unaffected and
   * /admin/login reports that the dashboard is not configured.
   *
   * These are the publishable browser credentials. `SUPABASE_SECRET_KEY` is
   * server-only and must never be exposed through a VITE_ variable.
   */
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  /** Public site details. */
  readonly VITE_SITE_URL?: string
  readonly VITE_CONTACT_EMAIL?: string
  readonly VITE_CONTACT_PHONE?: string
  readonly VITE_INSTAGRAM_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
