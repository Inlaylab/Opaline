import type { Rendered, Style } from '../create.ts'
import { face } from '../parts/face.ts'
import { bbox, finishDefs, finishOver, FINISHES, shadeOnly } from '../parts/finish.ts'
import { inscribed } from '../parts/inscribed.ts'
import { known } from '../parts/known.ts'
import { PALETTES, pickBase } from '../parts/palette.ts'
import {
  FAMILIES as ALL_FAMILIES,
  genome,
  smoothPath,
  type Family,
  type Point,
} from '../parts/shape.ts'
import { el, num } from '../svg.ts'
import type { BlobOptions } from './blob.ts'
import { colorVars, lch } from './paint.ts'

export type ClayOptions = BlobOptions & {
  /** `jelly`: the blob with nub arms. `hood`: a rounded hood with animal ears. */
  body?: 'jelly' | 'hood'
  ears?: 'cat' | 'bear' | 'bunny'
}

const BODIES = { jelly: true, hood: true }
const EARS = { cat: true, bear: true, bunny: true }
const EAR_NAMES = Object.keys(EARS) as (keyof typeof EARS)[]
const FAMILIES: Family[] = ['egg', 'duo', 'cushion', 'tri']
const ANY_FAMILY = Object.fromEntries(ALL_FAMILIES.map((f) => [f, true])) as Record<Family, true>
const INNER_EAR = lch(0.82, 0.08, 12)

const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${num(cx)} ${num(cy - ry)}A${num(rx)} ${num(ry)} 0 1 1 ${num(cx)} ${num(cy + ry)}A${num(rx)} ${num(ry)} 0 1 1 ${num(cx)} ${num(cy - ry)}Z`
const rotate = (a: number, x: number, y: number) => `rotate(${num(a)} ${num(x)} ${num(y)})`

/** Squishy 3D clay figures: a `jelly` blob with nub arms, or a `hood` with animal ears. */
export const clay: Style<ClayOptions> = {
  name: 'clay',
  defaults: { finish: 'soft', palette: 'vivid', face: true, backdrop: 'none' },
  render(ctx, opts): Rendered {
    const { rng, id } = ctx
    const palette = known(PALETTES, opts.palette) ?? 'vivid'
    const finish = known(FINISHES, opts.finish) ?? 'soft'
    const b = pickBase(rng, palette)
    // Every draw is always taken, in this order, so a set option never shifts the others.
    const g = rng.fork('clay')
    const drawnBody = g.next() < 0.5 ? 'jelly' : 'hood'
    const drawnFamily = g.pick(FAMILIES)
    const armAt = g.float(0.56, 0.68)
    const wave = g.next() < 0.33
    const leftAngle = g.float(18, 34)
    const rightAngle = g.float(18, 34)
    const drawnEars = g.pick(EAR_NAMES)
    const body = known(BODIES, opts.body) ?? drawnBody

    const color = colorVars()
    const base = color(lch(b.l, b.c, b.h))
    const dark = color(lch(b.l - 0.07, b.c, b.h))
    const picks: Record<string, unknown> = { palette, hue: Math.round(b.h), body, finish }
    let out = ''
    let at: { x: number; y: number; r: number }

    if (body === 'jelly') {
      const shape = genome(rng, known(ANY_FAMILY, opts.family) ?? drawnFamily)
      // Shrink the body so the arms fit inside the frame.
      const poly = shape.poly.map(([x, y]): Point => [50 + (x - 50) * 0.78, 53 + (y - 50) * 0.8])
      const d = smoothPath(poly.filter((_, i) => i % 3 === 0))
      const box = bbox(poly)
      const ay = box.y + box.h * armAt
      const near = poly.filter((p) => Math.abs(p[1] - ay) < 5).map((p) => p[0])
      const lx = Math.min(...near)
      const rx = Math.max(...near)
      const arm = (x: number, y: number, a: number) => {
        const p = ellipse(x, y, 7.5, 5.2)
        const t = rotate(a, x, y)
        return (
          el('path', { d: p, fill: dark, transform: t }) +
          (finish === 'flat' ? '' : shadeOnly(id, p, t))
        )
      }
      out += arm(lx + 1, ay, leftAngle)
      out += wave ? arm(rx + 1, ay - 13, -62) : arm(rx - 1, ay, -rightAngle)
      out += el('path', { d, fill: base }) + finishOver(finish, id, d, box)
      const [x, y, r] = inscribed(poly)
      at = { x, y, r }
      picks.family = shape.family
      picks.wave = wave
    } else {
      const ears = known(EARS, opts.ears) ?? drawnEars
      const pair = (draw: (k: -1 | 1) => string) => draw(-1) + draw(1)
      const mirror = (k: number) => (k < 0 ? undefined : 'translate(100 0) scale(-1 1)')
      if (ears === 'cat')
        out += pair(
          (k) =>
            el('path', { d: 'M17 40L24 9Q26 4 31 7L48 24Z', fill: dark, transform: mirror(k) }) +
            el('path', {
              d: 'M24 32L27 15Q28 12 31 14L40 23Z',
              fill: INNER_EAR,
              transform: mirror(k),
            }),
        )
      else if (ears === 'bear')
        out += pair(
          (k) =>
            el('circle', { cx: 50 + k * 27, cy: 25, r: 11, fill: dark }) +
            el('circle', { cx: 50 + k * 27, cy: 25, r: 5.8, fill: INNER_EAR }),
        )
      else
        out += pair(
          (k) =>
            el('ellipse', {
              cx: 50 + k * 14,
              cy: 17,
              rx: 7.5,
              ry: 17,
              fill: dark,
              transform: rotate(k * 12, 50 + k * 14, 17),
            }) +
            el('ellipse', {
              cx: 50 + k * 14,
              cy: 19,
              rx: 3.6,
              ry: 12,
              fill: INNER_EAR,
              transform: rotate(k * 12, 50 + k * 14, 19),
            }),
        )
      const d = ellipse(50, 58, 39, 36)
      out +=
        el('path', { d, fill: base }) +
        finishOver(finish, id, d, { x: 11, y: 22, w: 78, h: 72 }) +
        // The darker inner edge gives the opening depth.
        el('path', {
          d: ellipse(50, 62, 25.5, 22.5),
          fill: color(lch(0.95, 0.025, b.h + 30)),
          stroke: dark,
          'stroke-width': 3.2,
        })
      at = { x: 50, y: 63, r: 21 }
      picks.ears = ears
    }

    if (opts.backdrop === 'tint')
      out =
        el('circle', { cx: 50, cy: 50, r: 50, fill: `var(--avatar-bg, ${lch(0.95, 0.03, b.h)})` }) +
        out
    if (opts.face !== false) {
      const f = face(rng, { ...at, hue: b.h }, opts)
      out += f.svg
      picks.expression = f.expression
    }
    return { defs: finishDefs(finish, id, b.h), body: out, picks }
  },
}
