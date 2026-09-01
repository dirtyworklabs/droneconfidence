/**
 * Sending mail through Resend.
 *
 * Two rules shape this module. First, a paid booking is never rolled back
 * because an email failed — every send is best-effort and reports back instead of
 * throwing. Second, each kind of message is sent at most once per booking, which
 * is enforced by claiming a row in `booking_notifications` before the send.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { ENV_NAMES, env } from './../env'
import { logFailure } from './../http'
import type { EmailBody } from './render'

export type NotificationKind =
  | 'customer_confirmation'
  | 'owner_notification'
  | 'reminder_24h'
  | 'cancellation'
  | 'reschedule'

let cached: Resend | null = null

const client = (): Resend | null => {
  const key = env(ENV_NAMES.resendKey)
  if (key.length === 0) return null
  if (!cached) cached = new Resend(key)
  return cached
}

export const emailConfigured = (): boolean =>
  env(ENV_NAMES.resendKey).length > 0 && env(ENV_NAMES.resendFrom).length > 0

export interface SendOutcome {
  sent: boolean
  /** Short, non-personal reason a message did not go out. */
  skipped: string | null
}

const deliver = async (to: string, body: EmailBody): Promise<SendOutcome> => {
  const resend = client()
  const from = env(ENV_NAMES.resendFrom)
  if (!resend || from.length === 0) return { sent: false, skipped: 'email not configured' }

  const replyTo = env(ENV_NAMES.resendReplyTo)
  const { error } = await resend.emails.send({
    from,
    to,
    subject: body.subject,
    html: body.html,
    text: body.text,
    ...(replyTo.length > 0 ? { replyTo } : {}),
  })

  if (error) {
    // The provider's message is logged for the operator; the customer never sees
    // it, and the calling flow carries on.
    logFailure('email', new Error(error.message))
    return { sent: false, skipped: 'provider rejected the message' }
  }
  return { sent: true, skipped: null }
}

/**
 * Sends one message per (booking, kind).
 *
 * The notification row is claimed first: a unique violation means another
 * invocation — a webhook redelivery, or an overlapping reminder run — already
 * owns this message, so nothing is sent.
 */
export const sendOnce = async (
  supabase: SupabaseClient,
  bookingId: string,
  kind: NotificationKind,
  to: string,
  body: EmailBody,
): Promise<SendOutcome> => {
  const { error } = await supabase
    .from('booking_notifications')
    .insert({ booking_id: bookingId, kind })

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return { sent: false, skipped: 'already sent' }
    }
    logFailure('email-claim', new Error(error.message))
    return { sent: false, skipped: 'could not record the send' }
  }

  const outcome = await deliver(to, body)

  if (outcome.sent) {
    await supabase
      .from('booking_notifications')
      .update({ sent_at: new Date().toISOString() })
      .eq('booking_id', bookingId)
      .eq('kind', kind)
  } else {
    // Release the claim so a later run can try again.
    await supabase.from('booking_notifications').delete().eq('booking_id', bookingId).eq('kind', kind)
  }

  return outcome
}

/** Sends without an idempotency record — for messages that may legitimately repeat. */
export const sendAlways = async (to: string, body: EmailBody): Promise<SendOutcome> => deliver(to, body)

export const ownerAddress = (): string => env(ENV_NAMES.adminEmail)
