import type { Rng } from '../prng.ts'
import { num } from '../svg.ts'
import { known } from './known.ts'

export type Family = 'egg' | 'duo' | 'tri' | 'cushion' | 'clover' | 'petal'
export type Point = [number, number]
export type Genome = { family: Family; lobes: number; poly: Point[]; d: string }

const TAU = Math.PI * 2
// [lobes, min amp, max amp, fixed phase (undefined = seeded)]
const SPEC: Record<Family, [number, number, number, number?]> = {
  egg: [1, 0.05, 0.1, Math.PI / 2],
  duo: [2, 0.07, 0.12],
  tri: [3, 0.08, 0.12, -Math.PI / 2],
  cushion: [4, 0.035, 0.06, Math.PI / 4],
  clover: [4, 0.15, 0.2],
  petal: [5, 0.13, 0.17],
}
export const FAMILIES = Object.keys(SPEC) as readonly Family[]

/** Seeded blob: a radial lobe wave plus low wobble, fit into 8..92. */
export function genome(rng: Rng, requested?: Family): Genome {
  const g = rng.fork('shape')
  const family = known(SPEC, requested)
  // Always draw the family, so forcing one never shifts the draws after it.
  const fam = family ?? g.pick(FAMILIES)
  if (family) g.next()
  const [base, lo, hi, fixed] = SPEC[fam]
  const lobes = fam === 'petal' ? g.int(5, 6) : base
  const amp = g.float(lo, hi)
  const phase = (fixed ?? g.float(0, TAU)) + g.float(-0.18, 0.18)
  const wobble = [2, 3, 5].map((k) => [k, g.float(-0.035, 0.035), g.float(0, TAU)] as const)
  const sx = g.float(0.92, 1.08)

  const raw: Point[] = []
  for (let i = 0; i < 72; i++) {
    const t = (i / 72) * TAU
    let r = 1 + amp * Math.cos(lobes * (t - phase))
    for (const [k, a, p] of wobble) if (k !== lobes) r += a * Math.cos(k * t + p)
    raw.push([Math.cos(t) * r * sx, (Math.sin(t) * r) / sx])
  }
  const xs = raw.map((p) => p[0])
  const ys = raw.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const s = 84 / Math.max(x1 - x0, y1 - y0)
  const ox = 50 - ((x0 + x1) / 2) * s
  const oy = 50 - ((y0 + y1) / 2) * s
  const poly = raw.map(([x, y]): Point => [x * s + ox, y * s + oy])
  return { family: fam, lobes, poly, d: smoothPath(poly.filter((_, i) => i % 3 === 0)) }
}

/** Closed Catmull-Rom spline through the points, as cubic Béziers. */
export function smoothPath(points: Point[]): string {
  const n = points.length
  const at = (i: number) => points[(i + n) % n]!
  let d = `M${num(points[0]![0])} ${num(points[0]![1])}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    d += `C${num(p1[0] + (p2[0] - p0[0]) / 6)} ${num(p1[1] + (p2[1] - p0[1]) / 6)} ${num(p2[0] - (p3[0] - p1[0]) / 6)} ${num(p2[1] - (p3[1] - p1[1]) / 6)} ${num(p2[0])} ${num(p2[1])}`
  }
  return d + 'Z'
}
