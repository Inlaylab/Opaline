import { expect, test } from 'vitest'
import { adjust, cssVar, hexToOklch, oklchToHex, resolveVars } from '../src/color.ts'

test.each(['#7c5cff', '#ffffff', '#000000', '#0ea5a4'])('%s round-trips', (hex) => {
  expect(oklchToHex(hexToOklch(hex))).toBe(hex)
})

test('white has lightness 1', () => {
  expect(hexToOklch('#ffffff').l).toBeCloseTo(1, 3)
})

test('adjust darkens and keeps hue', () => {
  const base = hexToOklch('#7c5cff')
  const dark = hexToOklch(adjust('#7c5cff', { l: -0.1 }))
  expect(dark.l).toBeLessThan(base.l)
  expect(Math.abs(dark.h - base.h)).toBeLessThan(1)
})

test('out-of-gamut colors clamp to valid hex', () => {
  expect(oklchToHex({ l: 0.7, c: 0.4, h: 150 })).toMatch(/^#[0-9a-f]{6}$/)
})

test('accepts upper-case and short hex', () => {
  expect(oklchToHex(hexToOklch('#ABC'))).toBe('#aabbcc')
})

test('cssVar wraps a fallback', () => {
  expect(cssVar(1, '#7c5cff')).toBe('var(--avatar-c1, #7c5cff)')
})

test('resolveVars keeps only the fallback', () => {
  expect(resolveVars('<path fill="var(--avatar-c1, #7c5cff)"/>')).toBe('<path fill="#7c5cff"/>')
})
