import { lch } from '../styles/paint.ts'
import { el, num } from '../svg.ts'

export type Finish = 'flat' | 'soft' | 'gloss'
export const FINISHES: Record<Finish, true> = { flat: true, soft: true, gloss: true }
export type Box = { x: number; y: number; w: number; h: number }
type Ids = (name: string) => string

export function bbox(poly: readonly (readonly [number, number])[]): Box {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity
  for (const [x, y] of poly) {
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

const fade = (id: string, color: string, from: number, attrs: Record<string, number>) =>
  el(
    'radialGradient',
    { id, ...attrs },
    el('stop', { offset: 0, 'stop-color': color, 'stop-opacity': from }) +
      el('stop', { offset: 1, 'stop-color': color, 'stop-opacity': 0 }),
  )

/** Gradients a finish paints with. Gradients only, never filters; no random draws. */
export function finishDefs(finish: Finish, id: Ids, hue: number): string {
  if (finish === 'flat') return ''
  let out =
    fade(id('fs'), lch(0.3, 0.06, hue), 0.42, { cx: 0.66, cy: 0.92, r: 0.78 }) +
    fade(id('fl'), '#fff', 0.5, { cx: 0.3, cy: 0.22, r: 0.58 })
  if (finish === 'gloss')
    out += el(
      'linearGradient',
      { id: id('fr'), x1: 0, y1: 0, x2: 1, y2: 1 },
      el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.7 }) +
        el('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0 }),
    )
  return out
}

/** The shade alone, for small parts such as Clay arms and ears. */
export const shadeOnly = (id: Ids, d: string, transform?: string): string =>
  el('path', { d, fill: `url(#${id('fs')})`, transform })

/** Shade and light over a painted part. With `box` (the main body), gloss adds rim, highlight and glint. */
export function finishOver(finish: Finish, id: Ids, d: string, box?: Box): string {
  if (finish === 'flat') return ''
  let out = shadeOnly(id, d) + el('path', { d, fill: `url(#${id('fl')})` })
  if (finish === 'gloss' && box) {
    const hx = box.x + box.w * 0.3
    const hy = box.y + box.h * 0.19
    out +=
      el('path', { d, fill: 'none', stroke: `url(#${id('fr')})`, 'stroke-width': 1.6 }) +
      el('ellipse', {
        cx: hx,
        cy: hy,
        rx: box.w * 0.1,
        ry: box.h * 0.05,
        transform: `rotate(-32 ${num(hx)} ${num(hy)})`,
        fill: '#fff',
        opacity: 0.85,
      }) +
      el('circle', {
        cx: hx + box.w * 0.13,
        cy: hy - box.h * 0.03,
        r: box.w * 0.022,
        fill: '#fff',
        opacity: 0.7,
      })
  }
  return out
}
