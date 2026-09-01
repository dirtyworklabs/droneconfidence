/**
 * Lightweight analytics hooks.
 *
 * No provider is configured, and none is required. Events are forwarded to a
 * `window.dataLayer` array if some future provider creates one, and are
 * otherwise dropped. Payloads carry no personal information: never pass a
 * name, email, phone number, drone model or message content through here.
 */

export type AnalyticsEvent =
  | 'session_viewed'
  | 'booking_clicked'
  | 'booking_handoff_viewed'
  | 'external_booking_opened'
  | 'enquiry_submitted'

type AnalyticsPayload = Record<string, string | number | boolean | undefined>

interface DataLayerWindow extends Window {
  dataLayer?: Array<Record<string, unknown>>
}

export const track = (event: AnalyticsEvent, payload: AnalyticsPayload = {}): void => {
  if (typeof window === 'undefined') return
  const target = window as DataLayerWindow
  if (!Array.isArray(target.dataLayer)) return
  target.dataLayer.push({ event, ...payload })
}
