import { lch } from '../styles/paint.ts'
import { el, num } from '../svg.ts'
import type { Point } from './shape.ts'

/** Something a Plush wears. `none` keeps the critter bare. */
export type Accessory =
  'none' | 'beret' | 'cap' | 'beanie' | 'glasses' | 'shades' | 'flower' | 'sprout' | 'bow' | 'star'

export const ACCESSORIES: Record<Accessory, true> = {
  none: true,
  beret: true,
  cap: true,
  beanie: true,
  glasses: true,
  shades: true,
  flower: true,
  sprout: true,
  bow: true,
  star: true,
}
/** Worn on the face, so they need one. */
export const EYEWEAR: Partial<Record<Accessory, true>> = { glasses: true, shades: true }

/** Where an accessory goes: the head top above the face, and a spot on the upper side. */
export type Fit = {
  /** The face center x and the body top right above it. */
  x: number
  top: number
  /** The head width there, for hat sizes. */
  width: number
  /** A point on the upper-left or upper-right of the outline, for clips. */
  side: Point
  /** -1: clips and tilts go left; 1: right. */
  dir: -1 | 1
  /** The body hue, so an accessory can keep clear of it. */
  hue: number
}

const rot = (a: number, x: number, y: number) => `rotate(${num(a)} ${num(x)} ${num(y)})`
const near = (a: number, b: number) => Math.abs(((((a - b) % 360) + 540) % 360) - 180) < 40
/** A fixed accessory hue, moved to a darker shade when the body is close to it. */
const tone = (l: number, c: number, h: number, body: number) =>
  lch(near(h, body) ? l - 0.2 : l, c, h)

/** A dome hat from `x - w` to `x + w`, its brim line at `y`. */
const dome = (x: number, y: number, w: number, h: number) =>
  `M${num(x - w)} ${num(y)}C${num(x - w)} ${num(y - h * 1.33)} ${num(x + w)} ${num(y - h * 1.33)} ${num(x + w)} ${num(y)}Z`

/** Hats and clips, drawn over the body. Eyewear is drawn by `eyewear` in the face frame. */
export function accessory(kind: Accessory, f: Fit): string {
  const { x, top, dir } = f
  const w = Math.min(30, Math.max(17, f.width * 0.4))
  const tilt = rot(dir * 7, x, top)
  const [sx, sy] = f.side
  switch (kind) {
    case 'beret': {
      const cx = x + dir * 3
      const cy = top + 4
      const rx = w * 1.1
      const felt = lch(0.34, 0.06, f.hue + 200)
      return el(
        'g',
        { transform: rot(dir * -9, cx, cy) },
        el('circle', { cx, cy: cy - 9.6, r: 2.4, fill: felt }) +
          el('ellipse', { cx, cy, rx, ry: 9.6, fill: felt }) +
          el('ellipse', {
            cx: cx - rx * 0.3,
            cy: cy - 3.6,
            rx: rx * 0.45,
            ry: 2.6,
            fill: '#fff',
            opacity: 0.14,
          }),
      )
    }
    case 'cap': {
      const y = top + 8
      const cloth = lch(0.6, 0.15, f.hue + 180)
      return el(
        'g',
        { transform: tilt },
        el('ellipse', {
          cx: x + dir * w * 0.85,
          cy: y,
          rx: w * 0.58,
          ry: 3.4,
          fill: lch(0.47, 0.13, f.hue + 180),
        }) +
          el('path', { d: dome(x, y, w, 15), fill: cloth }) +
          el('circle', { cx: x, cy: y - 15, r: 2, fill: cloth }) +
          el('path', {
            d: `M${num(x - w * 0.55)} ${num(y - 9)}Q${num(x - w * 0.3)} ${num(y - 13.5)} ${num(x)} ${num(y - 14)}`,
            fill: 'none',
            stroke: '#fff',
            'stroke-opacity': 0.35,
            'stroke-width': 1.6,
            'stroke-linecap': 'round',
          }),
      )
    }
    case 'beanie': {
      // Taller than wide-brimmed hats, so it is never mistaken for a cap.
      const bw = Math.min(w, 24)
      const bh = bw * 0.66
      const y = top + 8
      const knit = lch(0.66, 0.14, f.hue + 140)
      return el(
        'g',
        { transform: tilt },
        el('path', { d: dome(x, y, bw, bh), fill: knit }) +
          el('circle', { cx: x, cy: y - bh, r: 4, fill: lch(0.95, 0.03, f.hue + 140) }) +
          el('rect', {
            x: x - bw - 1.5,
            y: y - 3,
            width: bw * 2 + 3,
            height: 7.5,
            rx: 3.75,
            fill: lch(0.56, 0.13, f.hue + 140),
          }),
      )
    }
    case 'flower': {
      const white = lch(0.98, 0.01, 90)
      let petals = ''
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.3
        petals += el('circle', {
          cx: sx + Math.cos(a) * 4.2,
          cy: sy + Math.sin(a) * 4.2,
          r: 3.5,
          fill: white,
        })
      }
      return petals + el('circle', { cx: sx, cy: sy, r: 2.6, fill: lch(0.84, 0.16, 85) })
    }
    case 'star': {
      let d = ''
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i / 10) * Math.PI * 2
        const r = i % 2 ? 2.6 : 6
        d += `${i ? 'L' : 'M'}${num(sx + Math.cos(a) * r)} ${num(sy + Math.sin(a) * r)}`
      }
      const gold = tone(0.86, 0.16, 92, f.hue)
      return el('path', {
        d: d + 'Z',
        fill: gold,
        stroke: gold,
        'stroke-width': 1.6,
        'stroke-linejoin': 'round',
        transform: rot(dir * 14, sx, sy),
      })
    }
    case 'bow': {
      const ribbon = tone(0.72, 0.16, 355, f.hue)
      const loop = (k: number) =>
        `M${num(sx)} ${num(sy)}L${num(sx + k * 8)} ${num(sy - 5)}Q${num(sx + k * 10)} ${num(sy)} ${num(sx + k * 8)} ${num(sy + 5)}Z`
      return el(
        'g',
        {
          transform: rot(dir * 20, sx, sy),
          fill: ribbon,
          stroke: ribbon,
          'stroke-width': 2,
          'stroke-linejoin': 'round',
        },
        el('path', { d: loop(-1) + loop(1) }) +
          el('circle', { cx: sx, cy: sy, r: 2.6, fill: lch(0.6, 0.16, 355), stroke: 'none' }),
      )
    }
    case 'sprout': {
      const leaf = tone(0.74, 0.17, 140, f.hue)
      const y = top + 2
      return (
        el('path', {
          d: `M${num(x)} ${num(y)}Q${num(x + dir)} ${num(y - 4)} ${num(x)} ${num(y - 8)}`,
          fill: 'none',
          stroke: tone(0.58, 0.14, 140, f.hue),
          'stroke-width': 1.8,
          'stroke-linecap': 'round',
        }) +
        el('ellipse', {
          cx: x - 4.4,
          cy: y - 9,
          rx: 4.8,
          ry: 2.7,
          fill: leaf,
          transform: rot(-28, x - 4.4, y - 9),
        }) +
        el('ellipse', {
          cx: x + 4.6,
          cy: y - 10,
          rx: 5.2,
          ry: 2.9,
          fill: leaf,
          transform: rot(24, x + 4.6, y - 10),
        })
      )
    }
    default:
      return ''
  }
}

/** Glasses or shades in the face frame: eyes at ±spread on y = 0. */
export function eyewear(kind: Accessory, spread: number, ink: string): string {
  const r = 8
  const inner = spread - r
  if (kind === 'glasses')
    return el('path', {
      d:
        [-1, 1]
          .map(
            (k) =>
              `M${num(k * spread - r)} 0A${r} ${r} 0 1 1 ${num(k * spread + r)} 0A${r} ${r} 0 1 1 ${num(k * spread - r)} 0Z`,
          )
          .join('') + `M${num(-inner)} -1Q0 -3.4 ${num(inner)} -1`,
      fill: 'none',
      stroke: ink,
      'stroke-width': 1.9,
      'stroke-linecap': 'round',
    })
  if (kind === 'shades') {
    let out = el('path', {
      d: `M${num(-inner)} -1.5Q0 -3.6 ${num(inner)} -1.5`,
      fill: 'none',
      stroke: ink,
      'stroke-width': 1.9,
      'stroke-linecap': 'round',
    })
    for (const k of [-1, 1])
      out +=
        el('ellipse', { cx: k * spread, cy: 0, rx: r + 0.4, ry: r - 1, fill: ink }) +
        el('ellipse', {
          cx: k * spread - 3,
          cy: -3,
          rx: 2.6,
          ry: 1.3,
          fill: '#fff',
          opacity: 0.55,
          transform: rot(-24, k * spread - 3, -3),
        })
    return out
  }
  return ''
}
