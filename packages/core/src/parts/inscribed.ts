import type { Point } from './shape.ts'

/**
 * Roughly the largest circle inside the polygon: a coarse grid, then a finer pass
 * around the best point. Faces go here so they never sit on a thin lobe.
 */
export function inscribed(poly: Point[]): [x: number, y: number, r: number] {
  const n = poly.length
  // Flat edge data: this runs ~60k edge checks per avatar, so avoid tuple reads and repeat math.
  // Edge i runs from point j = i - 1 to point i: ax ay bx by dx dy len².
  const E = new Float64Array(n * 7)
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [ax, ay] = poly[j]!
    const [bx, by] = poly[i]!
    const dx = bx - ax
    const dy = by - ay
    E.set([ax, ay, bx, by, dx, dy, dx * dx + dy * dy], i * 7)
    if (bx < minX) minX = bx
    if (bx > maxX) maxX = bx
    if (by < minY) minY = by
    if (by > maxY) maxY = by
  }
  // Squared distance to the boundary when inside (even-odd rule) and deeper than `floor`, else -1.
  // Stopping once the distance falls to `floor` cannot change the result: such a point never wins.
  const depth = (x: number, y: number, floor: number) => {
    if (x < minX || x > maxX || y < minY || y > maxY) return -1
    let inside = false
    let m = Infinity
    for (let k = 0; k < n * 7; k += 7) {
      const ax = E[k]!
      const ay = E[k + 1]!
      const bx = E[k + 2]!
      const by = E[k + 3]!
      if (by > y !== ay > y && x < ((ax - bx) * (y - by)) / (ay - by) + bx) inside = !inside
      const dx = E[k + 4]!
      const dy = E[k + 5]!
      let t = ((x - ax) * dx + (y - ay) * dy) / E[k + 6]!
      t = t < 0 ? 0 : t > 1 ? 1 : t
      const ex = x - ax - t * dx
      const ey = y - ay - t * dy
      const e = ex * ex + ey * ey
      if (e < m) {
        m = e
        if (m <= floor) return -1
      }
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
        const d = depth(x, y, best)
        if (d > best) [bx, by, best] = [x, y, d]
      }
  }
  scan(10, 10, 80, 16)
  scan(bx - 5, by - 5, 10, 10)
  return [bx, by, Math.sqrt(best)]
}
