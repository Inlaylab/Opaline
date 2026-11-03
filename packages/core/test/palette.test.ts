import { expect, test } from 'vitest'
import { createRng } from '../src/prng.ts'
import { PALETTES, pickBase, type PaletteName } from '../src/parts/palette.ts'

const angle = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180)

test.each(Object.keys(PALETTES) as PaletteName[])(
  '%s stays near its hues and lightness',
  (name) => {
    const p = PALETTES[name]
    for (let i = 0; i < 200; i++) {
      const base = pickBase(createRng('s' + i), name)
      expect(Math.min(...p.hues.map((h) => angle(base.h, h)))).toBeLessThanOrEqual(9)
      expect(Math.abs(base.l - p.l)).toBeLessThanOrEqual(0.03)
      expect(base.c).toBe(p.c)
    }
  },
)

test('same seed gives the same base', () => {
  expect(pickBase(createRng('a'), 'vivid')).toEqual(pickBase(createRng('a'), 'vivid'))
})

test('palette values match the approved sheet', () => {
  expect(PALETTES.vivid).toEqual({
    l: 0.74,
    c: 0.16,
    hues: [18, 42, 70, 145, 172, 205, 238, 268, 300, 335],
  })
  expect(PALETTES.mono).toEqual({ l: 0.66, c: 0.035, hues: [262] })
})
