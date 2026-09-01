/**
 * Response helpers.
 *
 * Customers never see a stack trace or a provider error string: failures are
 * mapped to a short machine-readable code and a plain sentence. The original
 * error is logged with a label and no personal data so it can still be found.
 */

const NO_STORE = {
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
  'Content-Type': 'application/json; charset=utf-8',
} as const

export const jsonResponse = (body: unknown, status = 200, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), { status, headers: { ...NO_STORE, ...headers } })

export const methodNotAllowed = (allowed: string): Response =>
  new Response(null, { status: 405, headers: { Allow: allowed } })

/**
 * Logs a failure without leaking anything sensitive. Secrets are never passed
 * in, and customer fields are deliberately not included at the call sites.
 */
export const logFailure = (label: string, error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[booking:${label}] ${message}`)
}

export const readJson = async <T>(request: Request): Promise<T | null> => {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}
