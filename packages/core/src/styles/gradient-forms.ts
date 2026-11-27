import { known } from '../parts/known.ts'
import { smoothPath, type Point } from '../parts/shape.ts'
import type { Rng } from '../prng.ts'

export type GradientForm =
  'pebble' | 'bean' | 'cloud' | 'leaf' | 'shell' | 'wave' | 'bun' | 'kite' | 'cushion'

const TAU = Math.PI * 2
type At = (t: number) => Point
/** Superellipse radius: `n` near 2 is round, higher is squarer. */
const superR = (n: number) => (t: number) =>
  1 / (Math.abs(Math.cos(t)) ** n + Math.abs(Math.sin(t)) ** n) ** (1 / n)
/** A radius function stretched into a point function. */
const stretch =
  (r: (t: number) => number, sx: number, sy: number): At =>
  (t) => [Math.cos(t) * r(t) * sx, Math.sin(t) * r(t) * sy]
/** Angle measured from the bottom, in -π..π. */
const fromBottom = (t: number) => Math.atan2(Math.sin(t + Math.PI / 2), Math.cos(t + Math.PI / 2))

/** Gradient's own smooth, low-lobe outlines (1.3, opt-in through `form`). */
const FORMS: Record<GradientForm, { at: At; turn?: number }> = {
  pebble: { at: stretch(superR(2.6), 1.14, 0.88) },
  bean: { at: stretch((t) => 1 - 0.34 * Math.exp(-((fromBottom(t) / 0.42) ** 2)), 1.2, 0.9) },
  cloud: {
    at: stretch((t) => 1 + 0.075 * Math.cos(5 * t) * (Math.sin(t) < 0.25 ? 1 : 0.25), 1.12, 0.9),
  },
  leaf: {
    at: (t) => [Math.cos(t), 0.62 * Math.sign(Math.sin(t)) * Math.abs(Math.sin(t)) ** 2],
    turn: -0.62,
  },
  shell: {
    at: stretch(
      (t) => 1 + 0.13 * Math.sin(t) + 0.035 * Math.cos(9 * t) * Math.max(0, Math.sin(t)),
      1.04,
      1,
    ),
  },
  wave: { at: stretch((t) => 1 + 0.045 * Math.cos(6 * t), 1, 1) },
  bun: {
    at: (t) => {
      if (Math.sin(t) < 0) return [1.25 * Math.cos(t), 0.82 * Math.sin(t)]
      const k = superR(4)(t)
      return [1.25 * Math.cos(t) * k, 0.5 * Math.sin(t) * k]
    },
  },
  kite: {
    at: (t) => {
      const k = superR(1.45)(t)
      return [Math.cos(t) * k * 0.82, Math.sin(t) * k * (Math.sin(t) > 0 ? 1.18 : 0.8)]
    },
  },
  cushion: { at: stretch(superR(3.4), 1, 0.94) },
}
export const GRADIENT_FORMS = Object.fromEntries(
  Object.keys(FORMS).map((k) => [k, true]),
) as Record<GradientForm, true>
const NAMES = Object.keys(FORMS) as GradientForm[]

/**
 * The outline for `form`. Both draws (the seeded form and the jitter) are always taken from
 * `rng.fork('form')`, so a set form keeps the jitter of the free one.
 */
export function formOutline(
  rng: Rng,
  requested: unknown,
): { form: GradientForm; poly: Point[]; d: string } {
  const g = rng.fork('form')
  const drawn = g.pick(NAMES)
  const form = known(FORMS, requested) ?? drawn
  const turn = (FORMS[form].turn ?? 0) + g.float(-0.12, 0.12)
  const [c, s] = [Math.cos(turn), Math.sin(turn)]
  const raw = Array.from({ length: 72 }, (_, i): Point => {
    const [x, y] = FORMS[form].at((i / 72) * TAU)
    return [x * c - y * s, x * s + y * c]
  })
  const xs = raw.map((p) => p[0])
  const ys = raw.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const k = 84 / Math.max(x1 - x0, y1 - y0)
  const ox = 50 - ((x0 + x1) / 2) * k
  const oy = 50 - ((y0 + y1) / 2) * k
  const poly = raw.map(([x, y]): Point => [x * k + ox, y * k + oy])
  return { form, poly, d: smoothPath(poly.filter((_, i) => i % 3 === 0)) }
}
