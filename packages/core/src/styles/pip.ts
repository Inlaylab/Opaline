import type { Rendered, Style } from '../create.ts'
import { bbox, finishDefs, finishOver, FINISHES, type Finish } from '../parts/finish.ts'
import { inscribed } from '../parts/inscribed.ts'
import { known } from '../parts/known.ts'
import { PALETTES, pickBase, type PaletteName } from '../parts/palette.ts'
import { smoothPath, type Point } from '../parts/shape.ts'
import { backdrop, SHAPES, type Shape } from '../parts/tile.ts'
import { el, num } from '../svg.ts'
import { colorVars, lch } from './paint.ts'

/** The outline of a Pip's body. */
export type PipForm =
  'circle' | 'squircle' | 'triangle' | 'hexagon' | 'diamond' | 'heart' | 'drop' | 'pill' | 'dome'

export type PipOptions = {
  palette?: PaletteName
  /** The body outline. Unset: drawn from the seed. */
  form?: PipForm
  /** The two pill eyes. Default on. */
  face?: boolean
  /** Light and shade over the body. Default `flat`. */
  finish?: Finish
  backdrop?: 'none' | 'tint'
  /** Draws the tint backdrop in this outline. */
  shape?: Shape
}

type Corner = number
/** Vertices, the corner size of each (a fraction of the shorter edge), and the optical size. */
type Polygon = { kind: 'poly'; v: Point[]; t: Corner[]; fit: number }
type Curve = { kind: 'curve'; at: (t: number) => Point; fit: number }

const TAU = Math.PI * 2
const ring = (n: number, start: number): Point[] =>
  Array.from({ length: n }, (_, i): Point => {
    const a = start + (i / n) * TAU
    return [Math.cos(a), Math.sin(a)]
  })

/**
 * Each form in unit space. Polygons get cubic corners; the heart and the drop are smooth curves.
 * `fit` is the size of the longer side in the 100-unit frame, tuned so every form reads as big.
 */
const FORMS: Record<PipForm, Polygon | Curve> = {
  circle: { kind: 'poly', v: ring(4, Math.PI / 4), t: [0.5, 0.5, 0.5, 0.5], fit: 80 },
  squircle: { kind: 'poly', v: ring(4, Math.PI / 4), t: [0.36, 0.36, 0.36, 0.36], fit: 78 },
  triangle: { kind: 'poly', v: ring(3, -Math.PI / 2), t: [0.24, 0.24, 0.24], fit: 88 },
  hexagon: { kind: 'poly', v: ring(6, -Math.PI / 2), t: Array(6).fill(0.3), fit: 84 },
  diamond: { kind: 'poly', v: ring(4, -Math.PI / 2), t: [0.26, 0.26, 0.26, 0.26], fit: 88 },
  pill: {
    kind: 'poly',
    v: [
      [-0.8, -0.5],
      [0.8, -0.5],
      [0.8, 0.5],
      [-0.8, 0.5],
    ],
    t: [0.5, 0.5, 0.5, 0.5],
    fit: 86,
  },
  dome: {
    kind: 'poly',
    v: [
      [-0.5, -0.55],
      [0.5, -0.55],
      [0.5, 0.55],
      [-0.5, 0.55],
    ],
    t: [0.5, 0.5, 0.2, 0.2],
    fit: 82,
  },
  heart: {
    kind: 'curve',
    // The classic heart curve, its bottom tip softened by the spline.
    at: (t) => [
      16 * Math.sin(t) ** 3,
      -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)),
    ],
    fit: 88,
  },
  drop: {
    kind: 'curve',
    // A teardrop with its tip up.
    at: (t) => [Math.sin(t) * Math.sin(t / 2) ** 1.3, -Math.cos(t)],
    fit: 84,
  },
}
const FORM_NAMES = Object.keys(FORMS) as PipForm[]

/** A cubic that bends to the next edge: 0.55 of the way to the vertex makes a right angle round. */
const K = 0.55

/** Path and outline samples of a polygon with rounded corners. */
function roundedPolygon(v: Point[], t: Corner[]): { d: string; poly: Point[] } {
  const n = v.length
  const lerp = (a: Point, b: Point, f: number): Point => [
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
  ]
  const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])
  let d = ''
  const poly: Point[] = []
  for (let i = 0; i < n; i++) {
    const p = v[(i + n - 1) % n]!
    const c = v[i]!
    const q = v[(i + 1) % n]!
    const r = t[i]! * Math.min(dist(p, c), dist(c, q))
    const a = lerp(c, p, r / dist(p, c))
    const b = lerp(c, q, r / dist(c, q))
    const c1 = lerp(a, c, K)
    const c2 = lerp(b, c, K)
    d += `${i ? 'L' : 'M'}${num(a[0])} ${num(a[1])}C${num(c1[0])} ${num(c1[1])} ${num(c2[0])} ${num(c2[1])} ${num(b[0])} ${num(b[1])}`
    for (let s = 0; s <= 8; s++) {
      const u = s / 8
      const w = 1 - u
      poly.push([
        w * w * w * a[0] + 3 * w * w * u * c1[0] + 3 * w * u * u * c2[0] + u * u * u * b[0],
        w * w * w * a[1] + 3 * w * w * u * c1[1] + 3 * w * u * u * c2[1] + u * u * u * b[1],
      ])
    }
  }
  return { d: d + 'Z', poly }
}

/** The form, turned and squashed, then scaled to its optical size around the frame center. */
function body(form: PipForm, turn: number, squash: number): { d: string; poly: Point[] } {
  const spec = FORMS[form]
  const cos = Math.cos(turn)
  const sin = Math.sin(turn)
  const move = ([x, y]: Point): Point => [
    (x * cos - y * sin) * squash,
    (x * sin + y * cos) / squash,
  ]
  const raw =
    spec.kind === 'poly'
      ? spec.v.map(move)
      : Array.from({ length: 36 }, (_, i) => move(spec.at((i / 36) * TAU)))
  const shape = (pts: Point[]) =>
    spec.kind === 'poly'
      ? roundedPolygon(pts, spec.t)
      : { d: smoothPath(pts.filter((_, i) => i % 2 === 0)), poly: pts }
  // Fit on the drawn outline, not the vertices: rounded corners stop short of them.
  const box = bbox(shape(raw).poly)
  const s = spec.fit / Math.max(box.w, box.h)
  const ox = 50 - (box.x + box.w / 2) * s
  const oy = 50 - (box.y + box.h / 2) * s
  return shape(raw.map(([x, y]): Point => [x * s + ox, y * s + oy]))
}

/** Faces are dots of ink: never thinner than this, so they still read at 24px. */
export const MIN_EYE = 4.6

/** Flat geometric characters with two pill eyes. */
export const pip: Style<PipOptions> = {
  name: 'pip',
  defaults: { palette: 'vivid', face: true, finish: 'flat', backdrop: 'none' },
  render({ rng, id }, opts): Rendered {
    const palette = known(PALETTES, opts.palette) ?? 'vivid'
    const finish = known(FINISHES, opts.finish) ?? 'flat'
    const b = pickBase(rng, palette)
    // Every draw is always taken, in this order, so a set option never shifts the others.
    const g = rng.fork('pip')
    const drawnForm = g.pick(FORM_NAMES)
    const turn = g.float(-0.1, 0.1)
    const squash = g.float(0.95, 1.05)
    const spread = g.float(0.3, 0.4)
    const gazeX = g.float(-0.14, 0.14)
    const gazeY = g.float(-0.12, 0.06)
    const tilt = g.float(-7, 7)
    const tall = g.float(1.9, 2.35)
    const form = known(FORMS, opts.form) ?? drawnForm

    const { d, poly } = body(form, form === 'circle' ? 0 : turn, squash)
    const [x, y, r] = inscribed(poly)
    // The gloss highlight goes by the inscribed circle, so it never floats off a tip or a lobe.
    const light = { x: x - r * 1.2, y: y - r * 1.2, w: r * 2.4, h: r * 2.4 }
    let out =
      el('path', { d, fill: colorVars()(lch(b.l, b.c, b.h)) }) + finishOver(finish, id, d, light)
    const tile = known(SHAPES, opts.shape)
    if (opts.backdrop === 'tint' || tile)
      out = backdrop(tile, `var(--avatar-bg, ${lch(0.95, 0.03, b.h)})`) + out
    const picks: Record<string, unknown> = { palette, hue: Math.round(b.h), form }
    if (finish !== 'flat') picks.finish = finish
    if (tile) picks.shape = tile

    if (opts.face !== false) {
      const w = Math.min(10, Math.max(MIN_EYE, r * 0.24))
      const h = w * tall
      const cx = x + gazeX * r
      const cy = y - r * 0.08 + gazeY * r
      const ink = lch(0.22, 0.035, b.h)
      let eyes = ''
      for (const k of [-1, 1]) {
        const ex = k * spread * r
        eyes +=
          el('rect', { x: ex - w / 2, y: -h / 2, width: w, height: h, rx: w / 2, fill: ink }) +
          // The library's signature light: a small glint toward the top-left of each eye.
          el('circle', {
            cx: ex - w * 0.12,
            cy: -h / 2 + w * 0.52,
            r: w * 0.2,
            fill: '#fff',
            opacity: 0.9,
          })
      }
      out += el('g', { transform: `translate(${num(cx)} ${num(cy)}) rotate(${num(tilt)})` }, eyes)
    }
    return { defs: finishDefs(finish, id, b.h), body: out, picks }
  },
}
