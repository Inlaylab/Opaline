import type { Rng } from '../prng.ts'
import { lch } from '../styles/paint.ts'
import { el, num } from '../svg.ts'

export type Finish = 'flat' | 'soft' | 'gloss' | 'gummy'
export const FINISHES: Record<Finish, true> = { flat: true, soft: true, gloss: true, gummy: true }
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
  // Gummy has its own defs (`gummyDefs`), which need the body colour.
  if (finish === 'flat' || finish === 'gummy') return ''
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
  if (finish === 'flat' || finish === 'gummy') return ''
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

type Pt = [number, number]
/** Points on an absolute `M/L/C/Q/Z` path (on the curve, not its control points); 8 per curve. */
export function outline(d: string): Pt[] {
  const tokens = d.match(/[MLCQZ]|-?\d*\.?\d+/g)!
  const pts: Pt[] = []
  let at: Pt = [0, 0]
  let cmd = 'M'
  for (let i = 0; i < tokens.length;) {
    if (/[MLCQZ]/.test(tokens[i]!)) cmd = tokens[i++]!
    if (cmd === 'Z') continue
    const take = (k: number) => {
      const p: Pt[] = []
      for (let j = 0; j < k; j++, i += 2) p.push([Number(tokens[i]), Number(tokens[i + 1])])
      return p
    }
    if (cmd === 'M' || cmd === 'L') {
      at = take(1)[0]!
      pts.push(at)
      continue
    }
    const ctrl = take(cmd === 'C' ? 3 : 2)
    const all = [at, ...ctrl]
    for (let s = 1; s <= 8; s++) {
      // de Casteljau: fold the control polygon down to one point at t.
      let q = all
      while (q.length > 1)
        q = q
          .slice(1)
          .map((p, k): Pt => [
            q[k]![0] + (p[0] - q[k]![0]) * (s / 8),
            q[k]![1] + (p[1] - q[k]![1]) * (s / 8),
          ])
      pts.push(q[0]!)
    }
    at = ctrl[ctrl.length - 1]!
  }
  return pts
}

// ---- Gummy: Plush 1.2's jelly material, shared by every style that takes `finish: 'gummy'` ----

export type Bubble = readonly [index: number, inset: number, r: number]
const BUBBLES = 4
const stop = (offset: number, c: string, o: number) =>
  el('stop', { offset, 'stop-color': c, 'stop-opacity': o })

/** Bubble draws, in Plush 1.2's order: how many show, then all four, always taken. */
export function drawBubbles(g: Rng, points: number): Bubble[] {
  const shown = g.int(2, BUBBLES)
  const all = Array.from({ length: BUBBLES }, (): Bubble => [
    g.int(0, points - 1),
    g.float(5, 9),
    g.float(1.3, 2.6),
  ])
  return all.slice(0, shown)
}

/** Jelly light (brighter middle, deeper edge), highlight and pooled shadow. `glow` may be a CSS var. */
export function gummyDefs(id: Ids, glow: string, b: { l: number; c: number; h: number }): string {
  const deep = lch(b.l - 0.2, b.c, b.h)
  return (
    el(
      'radialGradient',
      { id: id('jg'), cx: 0.45, cy: 0.4, r: 0.65 },
      stop(0, glow, 0.9) + stop(0.5, glow, 0) + stop(0.62, deep, 0) + stop(1, deep, 0.5),
    ) +
    el('radialGradient', { id: id('jh') }, stop(0, '#fff', 0.8) + stop(1, '#fff', 0)) +
    el(
      'radialGradient',
      { id: id('js') },
      stop(0, lch(0.3, 0.08, b.h), 0.32) + stop(1, lch(0.3, 0.08, b.h), 0),
    )
  )
}

/** The soft shadow pooled under the body, kept inside the frame. Draw it before the body. */
export const gummyShadow = (id: Ids, box: Box): string =>
  el('ellipse', {
    cx: num(box.x + box.w / 2),
    cy: num(Math.min(box.y + box.h + 1, 96)),
    rx: num(box.w * 0.46),
    ry: 3.2,
    fill: `url(#${id('js')})`,
  })

/**
 * Jelly over the painted body, its highlight, and clear bubbles just inside `edge`. Bubbles that
 * would sit on the face (`face` = [x, y, r]) are left out.
 */
export function gummyOver(
  id: Ids,
  d: string,
  box: Box,
  edge: readonly (readonly [number, number])[],
  center: readonly [number, number],
  bubbles: readonly Bubble[],
  face?: readonly [number, number, number],
): string {
  const hx = box.x + box.w * 0.3
  const hy = box.y + box.h * 0.2
  let out =
    el('path', { d, fill: `url(#${id('jg')})` }) +
    el('ellipse', {
      cx: num(hx),
      cy: num(hy),
      rx: num(box.w * 0.17),
      ry: num(box.h * 0.08),
      transform: `rotate(-22 ${num(hx)} ${num(hy)})`,
      fill: `url(#${id('jh')})`,
    })
  const [cx, cy] = center
  for (const [i, inset, br] of bubbles) {
    const [px, py] = edge[i % edge.length]!
    const dist = Math.hypot(cx - px, cy - py) || 1
    const bx = px + ((cx - px) * inset) / dist
    const by = py + ((cy - py) * inset) / dist
    if (face && Math.hypot(bx - face[0], by - face[1]) < face[2] * 0.9) continue
    out += el('circle', {
      cx: num(bx),
      cy: num(by),
      r: num(br),
      fill: '#fff',
      'fill-opacity': 0.3,
      stroke: '#fff',
      'stroke-opacity': 0.6,
      'stroke-width': 0.6,
    })
  }
  return out
}

/** Jelly light alone on an extra part, such as Clay arms or Critter ears. */
export const gummyPart = (id: Ids, d: string, transform?: string): string =>
  el('path', { d, fill: `url(#${id('jg')})`, transform })
