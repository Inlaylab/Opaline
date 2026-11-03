import { expect, test } from 'vitest'
import { createRng } from '../src/prng.ts'
import { genome, type Point } from '../src/parts/shape.ts'
import { inscribed } from '../src/parts/inscribed.ts'

test('a circle finds its own center and radius', () => {
  const circle: Point[] = Array.from({ length: 72 }, (_, i) => {
    const t = (i / 72) * Math.PI * 2
    return [50 + 40 * Math.cos(t), 50 + 40 * Math.sin(t)]
  })
  const [x, y, r] = inscribed(circle)
  expect(Math.abs(x - 50)).toBeLessThan(1)
  expect(Math.abs(y - 50)).toBeLessThan(1)
  expect(Math.abs(r - 40)).toBeLessThan(1)
})

test('every genome leaves room for a face', () => {
  for (let i = 0; i < 300; i++) {
    const [, , r] = inscribed(genome(createRng('s' + i)).poly)
    expect(r).toBeGreaterThanOrEqual(20)
  }
})

test('a thin-lobed shape centers in its body, not a lobe', () => {
  const { poly } = genome(createRng('clover'), 'clover')
  const [x, y] = inscribed(poly)
  expect(Math.hypot(x - 50, y - 50)).toBeLessThan(12)
})
