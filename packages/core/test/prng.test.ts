import { expect, test } from 'vitest'
import { createRng, hash } from '../src/prng.ts'

test('hash is stable', () => {
  expect(hash('ada@inlay.dev')).toBe('1z0ni6c')
})

test('hash is 7 base36 chars', () => {
  expect(hash('')).toMatch(/^[0-9a-z]{7}$/)
})

test('rng is pinned', () => {
  const r = createRng('ada@inlay.dev')
  expect([r.next(), r.next(), r.next()]).toEqual([
    0.9187400047667325, 0.7046724304091185, 0.17152338358573616,
  ])
})

test('fork ignores draws made before it', () => {
  const a = createRng('s')
  a.next()
  a.next()
  expect(a.fork('face').next()).toBe(createRng('s').fork('face').next())
})

test('forks with different labels differ', () => {
  const r = createRng('s')
  expect(r.fork('face').next()).not.toBe(r.fork('fill').next())
})

test('int is inclusive and in range', () => {
  const r = createRng('range')
  const seen = new Set<number>()
  for (let i = 0; i < 1000; i++) {
    const n = r.int(1, 7)
    expect(n).toBeGreaterThanOrEqual(1)
    expect(n).toBeLessThanOrEqual(7)
    seen.add(n)
  }
  expect(seen.has(1) && seen.has(7)).toBe(true)
})

test('float stays in range', () => {
  const r = createRng('f')
  for (let i = 0; i < 100; i++) {
    const n = r.float(-2, 3)
    expect(n >= -2 && n < 3).toBe(true)
  }
})

test('pick returns an item', () => {
  const items = ['a', 'b', 'c'] as const
  expect(items).toContain(createRng('p').pick(items))
})
