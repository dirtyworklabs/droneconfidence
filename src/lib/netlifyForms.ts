/**
 * Netlify Forms submission.
 *
 * Forms are registered at build time by public/__forms.html. Submissions POST
 * urlencoded data to that same path, which is what Netlify's form handler
 * expects. No backend, no external CRM, no email service.
 */

export type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

const FORM_ENDPOINT = '/__forms.html'

export interface SubmitResult {
  ok: boolean
  /** Friendly, non-technical message shown when a submission fails. */
  message?: string
}

export const submitNetlifyForm = async (
  formName: string,
  values: Record<string, string>,
): Promise<SubmitResult> => {
  const body = new URLSearchParams({ 'form-name': formName, ...values })

  try {
    const response = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    if (!response.ok) {
      return {
        ok: false,
        message:
          'That didn’t go through. Please try again in a moment — your details haven’t been sent yet.',
      }
    }

    return { ok: true }
  } catch {
    return {
      ok: false,
      message:
        'We couldn’t send that just now. Check your connection and try again — your details haven’t been sent yet.',
    }
  }
}

/** Simple duplicate-submission guard: identical payload, same page visit. */
export const createSubmissionGuard = () => {
  const seen = new Set<string>()
  return {
    isDuplicate: (payload: Record<string, string>) => seen.has(JSON.stringify(payload)),
    remember: (payload: Record<string, string>) => seen.add(JSON.stringify(payload)),
  }
}
