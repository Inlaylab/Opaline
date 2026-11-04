import { cssVar, oklchToHex } from '../color.ts'
import { el } from '../svg.ts'

export const lch = (l: number, c: number, h: number): string =>
  oklchToHex({ l, c, h: ((h % 360) + 360) % 360 })

/** Numbers each themeable color in paint order: --avatar-c1 is always the body. */
export function colorVars(): (hex: string) => string {
  let n = 0
  return (hex) => cssVar(++n, hex)
}

/** A soft color spot that fades to transparent. */
export const spot = (
  id: string,
  color: string,
  hex: string,
  cx: number,
  cy: number,
  r: number,
): string =>
  el(
    'radialGradient',
    { id, cx, cy, r },
    el('stop', { offset: 0, 'stop-color': color }) +
      el('stop', { offset: 1, 'stop-color': hex, 'stop-opacity': 0 }),
  )

/** Opaline sheen: milky light from the top-left. */
export const sheen = (id: string): string =>
  el(
    'radialGradient',
    { id, cx: 0.3, cy: 0.2, r: 0.55 },
    el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.42 }) +
      el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 }),
  )
