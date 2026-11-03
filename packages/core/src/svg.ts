export type Attrs = Record<string, string | number | undefined>

/** Up to 2 decimals, no trailing zeros, never `-0` or exponent form, so output is stable and small. */
export function num(n: number): string {
  const r = Math.round(n * 100) / 100
  if (r === 0) return '0'
  if (Math.abs(r) >= 1e21) return BigInt(r).toString()
  return r.toFixed(2).replace(/\.?0+$/, '')
}

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeXml(s: string): string {
  // Control characters other than tab, LF and CR are invalid in XML 1.0.
  return s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/[&<>"']/g, (c) => ENTITIES[c]!)
}

export function el(tag: string, attrs: Attrs = {}, children?: string): string {
  let out = '<' + tag
  for (const key in attrs) {
    const v = attrs[key]
    if (v !== undefined) out += ` ${key}="${typeof v === 'number' ? num(v) : escapeXml(v)}"`
  }
  return children === undefined ? out + '/>' : `${out}>${children}</${tag}>`
}
