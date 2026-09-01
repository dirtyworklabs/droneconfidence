/**
 * Email rendering.
 *
 * Every customer-supplied value passes through `escapeHtml` before it reaches
 * the HTML body, and each message also carries a plain-text alternative built
 * from the same data. The layout is deliberately plain: no tracking pixels, no
 * remote images, no scripts.
 */

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** First name only, for the greeting. Falls back to the whole value. */
export const firstName = (fullName: string): string => {
  const first = fullName.trim().split(/\s+/)[0] ?? ''
  return first.length > 0 ? first : fullName.trim()
}

export interface EmailBody {
  subject: string
  html: string
  text: string
}

export type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'label'; text: string }
  | { kind: 'lines'; items: string[] }
  | { kind: 'list'; items: string[] }
  | { kind: 'button'; label: string; href: string }

const INK = '#23282a'
const SOFT = '#4c5658'
const SAGE = '#5a7d63'

/**
 * Composes the HTML and text bodies from the same block list, so the two
 * versions of a message can't drift apart.
 */
export const renderEmail = (subject: string, blocks: Block[]): EmailBody => {
  const html: string[] = []
  const text: string[] = []

  for (const block of blocks) {
    switch (block.kind) {
      case 'heading':
        html.push(
          `<h1 style="margin:0 0 18px;font-size:20px;line-height:1.3;font-weight:600;color:${INK};">${escapeHtml(block.text)}</h1>`,
        )
        text.push(block.text, '')
        break
      case 'paragraph':
        html.push(
          `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${SOFT};">${escapeHtml(block.text)}</p>`,
        )
        text.push(block.text, '')
        break
      case 'label':
        html.push(
          `<p style="margin:24px 0 6px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${SAGE};">${escapeHtml(block.text)}</p>`,
        )
        text.push(block.text.toUpperCase())
        break
      case 'lines':
        html.push(
          `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${INK};">${block.items
            .map((item) => escapeHtml(item))
            .join('<br />')}</p>`,
        )
        text.push(...block.items, '')
        break
      case 'list':
        html.push(
          `<ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.6;color:${SOFT};">${block.items
            .map((item) => `<li style="margin:0 0 4px;">${escapeHtml(item)}</li>`)
            .join('')}</ul>`,
        )
        text.push(...block.items.map((item) => `- ${item}`), '')
        break
      case 'button':
        html.push(
          `<p style="margin:24px 0;"><a href="${escapeHtml(block.href)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:${SAGE};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${escapeHtml(block.label)}</a></p>`,
        )
        text.push(`${block.label}: ${block.href}`, '')
        break
    }
  }

  const document = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f6f4ef;">
<div style="max-width:560px;margin:0 auto;padding:32px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="background:#ffffff;border:1px solid rgba(35,40,42,0.08);border-radius:18px;padding:28px 26px;">
${html.join('\n')}
<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:${INK};">Drone Confidence</p>
</div>
</div>
</body></html>`

  return { subject, html: document, text: text.join('\n').trim() }
}
