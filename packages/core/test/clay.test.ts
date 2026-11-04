import { describe, expect, test } from 'vitest'
import { createAvatar } from '../src/index.ts'
import { clay } from '../src/styles/clay.ts'

const seeds = (n: number) => Array.from({ length: n }, (_, i) => `clay-${i}`)
const strip = (svg: string) => svg.replace(/a[0-9a-z]{7}-/g, 'ID-')

describe('pick order', () => {
  test('setting the drawn body or ears changes no pick', () => {
    let jelly = 0,
      hood = 0
    for (const seed of seeds(100)) {
      const j = createAvatar(clay, { seed }).toJSON()
      if (j.body === 'jelly') {
        jelly++
        expect(createAvatar(clay, { seed, body: 'jelly' }).toJSON()).toEqual(j)
      } else {
        hood++
        expect(createAvatar(clay, { seed, ears: j.ears as never }).toJSON()).toEqual(j)
      }
    }
    expect(jelly).toBeGreaterThan(20)
    expect(hood).toBeGreaterThan(20)
  })

  test('switching body keeps hue and expression', () => {
    for (const seed of seeds(40)) {
      const j = createAvatar(clay, { seed, body: 'jelly' }).toJSON()
      const h = createAvatar(clay, { seed, body: 'hood' }).toJSON()
      expect(h.hue).toBe(j.hue)
      expect(h.expression).toBe(j.expression)
    }
  })
})

describe('geometry', () => {
  test('arms and ears stay inside the frame', () => {
    for (const seed of seeds(300))
      for (const body of ['jelly', 'hood'] as const) {
        const svg = createAvatar(clay, { seed, body, finish: 'flat', face: false }).svg
        for (const m of svg.matchAll(/\b(?:cx|cy|d)="([^"]+)"/g))
          for (const n of m[1]!.match(/-?\d+(?:\.\d+)?/g) ?? []) {
            expect(Number(n)).toBeGreaterThanOrEqual(-1)
            expect(Number(n)).toBeLessThanOrEqual(101)
          }
      }
  })

  test('the jelly face has room: its scale never drops below the 15-unit radius', () => {
    for (const seed of seeds(300)) {
      const svg = createAvatar(clay, { seed, body: 'jelly' }).svg
      const scale = Number(svg.match(/translate\([^)]*\) rotate\([^)]*\) scale\(([\d.]+)\)/)![1])
      // Face scale is clamp(r / 22, 0.5, 1.2), so r >= 15 means scale >= 15 / 22.
      expect(scale).toBeGreaterThanOrEqual(15 / 22 - 0.01)
    }
  })
})

describe('theme variables', () => {
  test('jelly: body c1, arms c2', () => {
    const svg = createAvatar(clay, { seed: 'a', body: 'jelly', finish: 'flat' }).svg
    expect(
      svg.match(/<path[^>]*fill="var\(--avatar-c2,[^"]*"[^>]*transform="rotate/g),
    ).toHaveLength(2)
    expect(svg).toMatch(/<path d="M[^"]+" fill="var\(--avatar-c1, #[0-9a-f]{6}\)"\/>/)
  })

  test('hood: opening c3, ears c2, tint is --avatar-bg', () => {
    const svg = createAvatar(clay, { seed: 'a', body: 'hood', ears: 'bear', backdrop: 'tint' }).svg
    expect(svg).toMatch(/fill="var\(--avatar-c3, #[0-9a-f]{6}\)" stroke=/)
    expect(svg.match(/<circle[^>]*r="11" fill="var\(--avatar-c2,/g)).toHaveLength(2)
    expect(svg).toMatch(/fill="var\(--avatar-bg, #/)
  })
})

describe('options', () => {
  test('unknown values fall back to the drawn ones and never throw', () => {
    for (const seed of seeds(20)) {
      const plain = createAvatar(clay, { seed })
      const bad = createAvatar(clay, { seed, body: 'cat', ears: 'dog', finish: 'shiny' } as never)
      expect(strip(bad.svg)).toBe(strip(plain.svg))
    }
  })

  test('clay defaults to soft, and finish soft equals unset', () => {
    const plain = createAvatar(clay, { seed: 'a' })
    expect(plain.toJSON().finish).toBe('soft')
    expect(createAvatar(clay, { seed: 'a', finish: 'soft' }).svg).toBe(plain.svg)
  })

  test('gloss strokes the rim on the body only', () => {
    for (const body of ['jelly', 'hood'] as const) {
      const svg = createAvatar(clay, { seed: 'a', body, finish: 'gloss' }).svg
      expect(svg.match(/stroke="url\(#[^)]+-fr\)"/g)).toHaveLength(1)
    }
  })
})
