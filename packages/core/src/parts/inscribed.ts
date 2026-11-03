import type { Point } from './shape.ts'

/**
 * Roughly the largest circle inside the polygon: a coarse grid, then a finer pass
 * around the best point. Faces go here so they never sit on a thin lobe.
 */
export function inscribed(poly: Point[]): [x: number, y: number, r: number] {
  const n = poly.length
  // Flat coordinates: this runs ~60k edge checks per avatar, so avoid tuple reads.
  const P = new Float64Array(n * 2)
  for (let i = 0; i < n; i++) {
    P[i * 2] = poly[i]![0]
    P[i * 2 + 1] = poly[i]![1]
  }
  // Squared distance to the boundary, or -1 when outside (even-odd rule).
  const depth = (x: number, y: number) => {
    let inside = false
    let m = Infinity
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const ax = P[j * 2]!
      const ay = P[j * 2 + 1]!
      const bx = P[i * 2]!
      const by = P[i * 2 + 1]!
      if (by > y !== ay > y && x < ((ax - bx) * (y - by)) / (ay - by) + bx) inside = !inside
      const dx = bx - ax
      const dy = by - ay
      let t = ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)
      t = t < 0 ? 0 : t > 1 ? 1 : t
      const ex = x - ax - t * dx
      const ey = y - ay - t * dy
      const e = ex * ex + ey * ey
      if (e < m) m = e
    }
    return inside ? m : -1
  }
  let bx = 50
  let by = 50
  let best = 0
  const scan = (x0: number, y0: number, span: number, steps: number) => {
    for (let i = 0; i <= steps; i++)
      for (let j = 0; j <= steps; j++) {
        const x = x0 + (span * i) / steps
        const y = y0 + (span * j) / steps
        const d = depth(x, y)
        if (d > best) [bx, by, best] = [x, y, d]
      }
  }
  scan(10, 10, 80, 16)
  scan(bx - 5, by - 5, 10, 10)
  return [bx, by, Math.sqrt(best)]
}
