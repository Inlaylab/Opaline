import { expect, test } from 'vitest'
import { createRng } from '../src/prng.ts'
import { FAMILIES, genome, smoothPath, type Family } from '../src/parts/shape.ts'

test('72 samples fit inside 8..92 with the long side at 84', () => {
  for (let i = 0; i < 300; i++) {
    const { poly } = genome(createRng('s' + i))
    expect(poly).toHaveLength(72)
    const xs = poly.map((p) => p[0])
    const ys = poly.map((p) => p[1])
    for (const v of [...xs, ...ys]) {
      expect(v).toBeGreaterThanOrEqual(7.999)
      expect(v).toBeLessThanOrEqual(92.001)
    }
    const long = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
    expect(long).toBeCloseTo(84, 2)
  }
})

test.each([
  ['egg', [1]],
  ['duo', [2]],
  ['tri', [3]],
  ['cushion', [4]],
  ['clover', [4]],
  ['petal', [5, 6]],
] as [Family, number[]][])('%s has the right lobe count', (family, lobes) => {
  const g = genome(createRng('x'), family)
  expect(g.family).toBe(family)
  expect(lobes).toContain(g.lobes)
})

test('path is closed with one curve per third sample', () => {
  const { d, poly } = genome(createRng('a'))
  expect(d.startsWith('M')).toBe(true)
  expect(d.endsWith('Z')).toBe(true)
  expect(d.match(/C/g)).toHaveLength(poly.length / 3)
})

test('same seed gives the same path', () => {
  expect(genome(createRng('a')).d).toBe(genome(createRng('a')).d)
})

test('forcing a family keeps the other shape draws', () => {
  const free = genome(createRng('k'))
  const forced = genome(createRng('k'), free.family)
  expect(forced.d).toBe(free.d)
})

test('every family appears across seeds', () => {
  const seen = new Set<Family>()
  for (let i = 0; i < 600; i++) seen.add(genome(createRng('f' + i)).family)
  expect([...seen].sort()).toEqual([...FAMILIES].sort())
})

test('smoothPath of a square passes through its corners', () => {
  const d = smoothPath([
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ])
  expect(d).toMatch(/^M0 0C.* 10 0C.* 10 10C.* 0 10C.* 0 0Z$/)
})
