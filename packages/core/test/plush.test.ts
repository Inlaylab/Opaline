import { describe, expect, test } from 'vitest'
import { createAvatar } from '../src/index.ts'
import type { Accessory } from '../src/parts/accessory.ts'
import { plush } from '../src/styles/plush.ts'

const seeds = (n: number) => Array.from({ length: n }, (_, i) => `plush-${i}`)
const ACCESSORIES: Accessory[] = [
  'none',
  'beret',
  'cap',
  'beanie',
  'glasses',
  'shades',
  'flower',
  'sprout',
  'bow',
  'star',
]
const strip = (svg: string) => svg.replace(/a[0-9a-z]{7}-/g, 'ID-')

describe('pick order', () => {
  test('setting the drawn accessory or family changes no pick and no pixel', () => {
    for (const seed of seeds(60)) {
      const a = createAvatar(plush, { seed })
      const { accessory, family } = a.toJSON() as unknown as { accessory: Accessory; family: never }
      for (const forced of [
        createAvatar(plush, { seed, accessory }),
        createAvatar(plush, { seed, family }),
      ]) {
        expect(forced.toJSON()).toEqual(a.toJSON())
        expect(strip(forced.svg)).toBe(strip(a.svg))
      }
    }
  })

  test('the seed draws every accessory, and some critters wear none', () => {
    const seen = seeds(400).map((seed) => createAvatar(plush, { seed }).toJSON().accessory)
    expect([...new Set(seen)].sort()).toEqual([...ACCESSORIES].sort())
    expect(seen.filter((a) => a === 'none').length).toBeGreaterThan(40)
  })

  test('switching accessory keeps hue, family, expression and the body', () => {
    for (const seed of seeds(20)) {
      const all = ACCESSORIES.map((accessory) => createAvatar(plush, { seed, accessory }))
      const body = (svg: string) => /fill="var\(--avatar-c1[^"]*"/.exec(svg)?.[0]
      for (const a of all) {
        const j = a.toJSON()
        expect([j.hue, j.family, j.expression]).toEqual([
          all[0]!.toJSON().hue,
          all[0]!.toJSON().family,
          all[0]!.toJSON().expression,
        ])
        expect(body(a.svg)).toBe(body(all[0]!.svg))
      }
    }
  })
})

describe('geometry', () => {
  // 600 renders: plenty to catch a stray hat, and a timeout for busy CI runners (5 s timed out).
  test('drips, shadow, bubbles and accessories stay inside the frame', { timeout: 30_000 }, () => {
    const outside: string[] = []
    for (const seed of seeds(60))
      for (const accessory of ACCESSORIES) {
        const svg = createAvatar(plush, { seed, accessory, face: false }).svg
        for (const m of svg.matchAll(/\b(?:cx|cy|d|x|y)="([^"]+)"/g))
          for (const n of m[1]!.match(/-?\d+(?:\.\d+)?/g) ?? [])
            if (Number(n) < -1 || Number(n) > 101) outside.push(`${seed}/${accessory}: ${n}`)
      }
    expect(outside).toEqual([])
  })
})

describe('options', () => {
  test('eyewear needs a face: with face: false it is left off and the pick reads none', () => {
    for (const accessory of ['glasses', 'shades'] as const) {
      const a = createAvatar(plush, { seed: 'a', accessory, face: false })
      expect(a.toJSON().accessory).toBe('none')
      expect(strip(a.svg)).toBe(
        strip(createAvatar(plush, { seed: 'a', accessory: 'none', face: false }).svg),
      )
    }
  })

  test('eyewear sits inside the face group, so it follows the eyes', () => {
    const svg = createAvatar(plush, { seed: 'a', accessory: 'glasses' }).svg
    expect(svg).toMatch(/<g transform="translate\([^"]+\) scale\([^"]+\)">.*A8 8 0 1 1/)
  })

  test('body is --avatar-c1 like every style, the gummy centre c2; no filters', () => {
    const svg = createAvatar(plush, { seed: 'a' }).svg
    expect(svg).toMatch(/<stop offset="0" stop-color="var\(--avatar-c2, #[0-9a-f]{6}\)"/)
    expect(svg).toMatch(/<path d="M[^"]+" fill="var\(--avatar-c1, #[0-9a-f]{6}\)"\/>/)
    expect(svg).not.toContain('<filter')
  })

  test('unknown values fall back to the drawn ones and never throw', () => {
    for (const seed of seeds(20)) {
      const plain = createAvatar(plush, { seed })
      for (const bad of ['nope', '__proto__', 'constructor', 'toString']) {
        const odd = { seed, accessory: bad, family: bad, palette: bad, shape: bad } as never
        expect(strip(createAvatar(plush, odd).svg)).toBe(strip(plain.svg))
      }
    }
  })
})
