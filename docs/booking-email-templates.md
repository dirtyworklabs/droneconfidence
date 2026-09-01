# Booking email templates

Copy to paste into the scheduling platform when booking goes live. **Do not build a custom
email-sending service for this** — no email infrastructure exists in this repository, and none is
needed. Placeholders in `[SQUARE BRACKETS]` are filled by the booking platform's merge fields.

---

## 1. Booking confirmation

**Subject:** You're booked — Drone Confidence

> **You're booked.**
>
> Hi [FIRST NAME],
>
> Thanks for booking a Drone Confidence session.
>
> Your payment has been received and your session is confirmed.
>
> **Your session**
> [SESSION]
> [DATE]
> [TIME]
> [TRAINING AREA]
>
> We'll review the information about your drone and confirm your meeting point before the lesson.
>
> **Please bring:**
> - Your drone
> - Controller
> - Charged batteries
> - Phone or tablet if required
> - Memory card
> - Any accessories you'd like help with
>
> We'll keep an eye on the weather leading up to the session.
>
> If conditions aren't suitable for safe flying, we'll reschedule at no cost or refund you in full.
>
> See you there.
>
> Drone Confidence

---

## 2. 24-hour reminder

**Subject:** Your Drone Confidence session is tomorrow

> Hi [FIRST NAME],
>
> A quick reminder to:
> - Charge your drone batteries
> - Charge your controller
> - Charge your phone or tablet
> - Bring your memory card
> - Bring any accessories you'd like help with
> - Check that your drone app opens correctly
>
> **Your meeting location**
> [LOCATION]
>
> **Your session**
> [SESSION + TIME]
>
> If weather conditions require a change, we'll contact you directly.
>
> See you tomorrow.
>
> Drone Confidence

---

## 3. Weather reschedule

Send this manually once **you** have decided conditions aren't suitable. Never automate a go/no-go
decision from a weather API.

**Subject:** We need to move your Drone Confidence session

> Hi [FIRST NAME],
>
> The conditions for your scheduled Drone Confidence session aren't looking suitable for safe and
> useful flying.
>
> Rather than compromise the session, we'll move your booking to another suitable time at no cost —
> or refund you in full if you'd prefer.
>
> Use the booking link below to choose another available time, or reply and we'll help arrange it.
>
> [RESCHEDULE LINK]
>
> Drone Confidence

---

## 4. Cancellation

**Subject:** Your Drone Confidence booking has been cancelled

> Hi [FIRST NAME],
>
> Your booking for:
> [SESSION]
> [DATE]
> [TIME]
>
> has been cancelled.
>
> **Refund:**
> [REFUND INFORMATION]
>
> Please allow several business days for a refund to appear, depending on your bank/payment
> provider.
>
> Drone Confidence

Fill `[REFUND INFORMATION]` from the published policy — full refund, or 50% refunded and 50%
retained, or free reschedule/full refund for a weather change.

---

## 5. Meeting details

The booking platform may send or update meeting details separately. Whichever message carries them
should include:

- Training area (South Sydney — Taren Point, or North Sydney — North Ryde)
- The exact meeting point
- Street address
- An optional map link
- Arrival instructions (where to park, where to wait, what to look for)
- A contact number for the day

Keep the exact meeting point in the booking emails. It is deliberately **not** published on the
marketing website — the FAQ says the meeting point is provided with a confirmed booking. Only change
that if it's an intentional decision later.
