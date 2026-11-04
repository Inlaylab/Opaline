import { describe, expect, test } from 'vitest'
import { createAvatar } from '../src/index.ts'
import { gradient } from '../src/styles/gradient.ts'
import { morph } from '../src/styles/morph.ts'
import { SEEDS } from './seeds.ts'

describe('finish defaults keep 0.2 output', () => {
  for (const [name, style] of [
    ['morph', morph],
    ['gradient', gradient],
  ] as const) {
    test(`${name}: finish flat equals unset, svg and json`, () => {
      for (const seed of SEEDS) {
        const plain = createAvatar(style, { seed })
        const flat = createAvatar(style, { seed, finish: 'flat' })
        expect(flat.svg).toBe(plain.svg)
        expect(flat.toJSON()).toEqual(plain.toJSON())
        expect(plain.toJSON()).not.toHaveProperty('finish')
      }
    })
  }

  test('an unknown finish renders as flat', () => {
    // Like other unknown options (0.2), the drawing falls back; only the ID scope differs.
    const strip = (svg: string) => svg.replace(/a[0-9a-z]{7}-/g, 'ID-')
    expect(strip(createAvatar(gradient, { seed: 'a', finish: 'shiny' as never }).svg)).toBe(
      strip(createAvatar(gradient, { seed: 'a' }).svg),
    )
  })
})

describe('soft and gloss', () => {
  test('a finish takes no draws: picks match flat except finish', () => {
    const flat = createAvatar(morph, { seed: 'a' }).toJSON()
    const soft = createAvatar(morph, { seed: 'a', finish: 'soft' }).toJSON()
    expect(soft.finish).toBe('soft')
    expect({ ...soft, finish: undefined }).toEqual({ ...flat, finish: undefined })
  })

  test('soft gradient: shade and light, no sheen', () => {
    const svg = createAvatar(gradient, { seed: 'a', finish: 'soft' }).svg
    expect(svg).toMatch(/radialGradient id="[^"]+-fs"/)
    expect(svg).toMatch(/radialGradient id="[^"]+-fl"/)
    expect(svg).not.toMatch(/id="[^"]+-s"/)
    expect(svg).not.toMatch(/-fr"/)
  })

  test('gloss adds rim, highlight and glint', () => {
    const svg = createAvatar(morph, { seed: 'a', finish: 'gloss' }).svg
    expect(svg).toMatch(/linearGradient id="[^"]+-fr"/)
    expect(svg.match(/<ellipse[^>]*fill="#fff"/g)).toHaveLength(1)
    expect(svg.match(/<circle[^>]*fill="#fff"[^>]*opacity="0.7"/g)).toHaveLength(1)
  })
})
