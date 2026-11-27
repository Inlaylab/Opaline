import type { Rendered, Style } from '../create.ts'
import { face } from '../parts/face.ts'
import {
  bbox,
  drawBubbles,
  finishDefs,
  finishOver,
  FINISHES,
  gummyDefs,
  gummyOver,
  gummyPart,
  gummyShadow,
  shadeOnly,
  type Box,
} from '../parts/finish.ts'
import { inscribed } from '../parts/inscribed.ts'
import { known } from '../parts/known.ts'
import { PALETTES, pickBase } from '../parts/palette.ts'
import { backdrop, SHAPES } from '../parts/tile.ts'
import { ALL_FAMILIES, genome, smoothPath, type Family, type Point } from '../parts/shape.ts'
import { el, num } from '../svg.ts'
import type { BlobOptions } from './blob.ts'
import { colorVars, lch } from './paint.ts'

export type ClayOptions = BlobOptions & {
  /** `jelly`: the blob with nub arms. `hood`: a rounded hood with animal ears. */
  body?: 'jelly' | 'hood' | 'ghost'
  ears?: 'cat' | 'bear' | 'bunny' | 'fox' | 'mouse'
}

// `ghost`, `fox` and `mouse` are 1.3 and opt-in: the seeded draws keep the 1.2 choices.
const BODIES = { jelly: true, hood: true, ghost: true }
const EARS = { cat: true, bear: true, bunny: true, fox: true, mouse: true }
const EAR_NAMES = ['cat', 'bear', 'bunny'] as const
/** A dome with a scalloped hem. */
const GHOST =
  'M18 54A32 32 0 0 1 82 54L82 86Q77 81 71.6 86Q66 91 60.8 86Q55.4 81 50 86Q44.6 91 39.2 86Q34 81 28.4 86Q23 91 18 86Z'
const ring = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n: number,
  from = 0,
  to = Math.PI * 2,
): Point[] =>
  Array.from({ length: n }, (_, i): Point => {
    const t = from + ((to - from) * i) / n
    return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)]
  })
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
    // Gummy: its defs, bubbles (from their own fork) and pooled shadow; the jelly goes on below.
    const gummy = finish === 'gummy'
    const bubbles = gummy ? drawBubbles(rng.fork('gummy'), 48) : []
    const gummyDef = gummy
      ? gummyDefs(id, color(lch(Math.min(b.l + 0.14, 0.97), b.c * 0.7, b.h)), b)
      : ''
    let shadowBox: Box | undefined
    const jelly = (
      d: string,
      box: Box,
      edge: Point[],
      center: readonly [number, number],
      f: { x: number; y: number; r: number },
    ) =>
      gummy
        ? gummyOver(
            id,
            d,
            box,
            edge,
            center,
            bubbles,
            opts.face !== false ? [f.x, f.y, f.r] : undefined,
          )
        : ''

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
          (gummy ? gummyPart(id, p, t) : finish === 'flat' ? '' : shadeOnly(id, p, t))
        )
      }
      out += arm(lx + 1, ay, leftAngle)
      out += wave ? arm(rx + 1, ay - 13, -62) : arm(rx - 1, ay, -rightAngle)
      const [x, y, r] = inscribed(poly)
      at = { x, y, r }
      out +=
        el('path', { d, fill: base }) +
        finishOver(finish, id, d, box) +
        jelly(d, box, poly, [box.x + box.w / 2, box.y + box.h / 2], at)
      shadowBox = box
      picks.family = shape.family
      picks.wave = wave
    } else if (body === 'ghost') {
      const box = { x: 18, y: 22, w: 64, h: 69 }
      at = { x: 50, y: 54, r: 22 }
      const edge = [
        ...ring(50, 54, 32, 32, 40, Math.PI, Math.PI * 2),
        [82, 86],
        [66, 88],
        [50, 86],
        [34, 88],
        [18, 86],
      ] as Point[]
      out +=
        el('path', { d: GHOST, fill: base }) +
        finishOver(finish, id, GHOST, box) +
        jelly(GHOST, box, edge, [50, 60], at)
      shadowBox = box
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
      else if (ears === 'fox')
        out += pair(
          (k) =>
            el('path', { d: 'M14 46L19 6L46 27Z', fill: dark, transform: mirror(k) }) +
            el('path', {
              d: 'M21 36L23 17L37 28Z',
              fill: lch(0.95, 0.025, b.h + 30),
              transform: mirror(k),
            }),
        )
      else if (ears === 'mouse')
        out += pair(
          (k) =>
            el('circle', { cx: 50 + k * 30, cy: 26, r: 16, fill: dark }) +
            el('circle', { cx: 50 + k * 30, cy: 26, r: 9, fill: INNER_EAR }),
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
      const hood = { x: 11, y: 22, w: 78, h: 72 }
      shadowBox = hood
      out +=
        el('path', { d, fill: base }) +
        finishOver(finish, id, d, hood) +
        jelly(d, hood, ring(50, 58, 39, 36, 48), [50, 58], { x: 50, y: 63, r: 21 }) +
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

    if (gummy && shadowBox) out = gummyShadow(id, shadowBox) + out
    const shape = known(SHAPES, opts.shape)
    if (opts.backdrop === 'tint' || shape)
      out = backdrop(shape, `var(--avatar-bg, ${lch(0.95, 0.03, b.h)})`) + out
    if (shape) picks.shape = shape
    if (opts.face !== false) {
      const f = face(rng, { ...at, hue: b.h }, opts)
      out += f.svg
      picks.expression = f.expression
    }
    return { defs: finishDefs(finish, id, b.h) + gummyDef, body: out, picks }
  },
}
