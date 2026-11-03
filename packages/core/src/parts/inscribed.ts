import type { Point } from './shape.ts'

/**
 * Roughly the largest circle inside the polygon: a coarse grid, then a finer pass
 * around the best point. Faces go here so they never sit on a thin lobe.
 */
export function inscribed(poly: Point[]): [x: number, y: number, r: number] {
  const n = poly.length
  const inside = (x: number, y: number) => {
    let c = false
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const [xi, yi] = poly[i]!
      const [xj, yj] = poly[j]!
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
    }
    return c
  }
  const dist = (x: number, y: number) => {
    let m = Infinity
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const [ax, ay] = poly[j]!
      const [bx, by] = poly[i]!
      const dx = bx - ax
      const dy = by - ay
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
      m = Math.min(m, Math.hypot(x - ax - t * dx, y - ay - t * dy))
    }
    return m
  }
  let best: [number, number, number] = [50, 50, 0]
  const scan = (x0: number, y0: number, span: number, steps: number) => {
    for (let i = 0; i <= steps; i++)
      for (let j = 0; j <= steps; j++) {
        const x = x0 + (span * i) / steps
        const y = y0 + (span * j) / steps
        if (!inside(x, y)) continue
        const r = dist(x, y)
        if (r > best[2]) best = [x, y, r]
      }
  }
  scan(10, 10, 80, 16)
  scan(best[0] - 5, best[1] - 5, 10, 10)
  return best
}
