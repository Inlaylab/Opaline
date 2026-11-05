import { expect, test } from 'vitest'
import { createAvatar } from '../src/index.ts'
import { forRaster } from '../src/png.ts'
import { clay } from '../src/styles/clay.ts'
import { initials } from '../src/styles/initials.ts'

const avatar = createAvatar(clay, { seed: 'ada@inlay.dev' })

test('forRaster bakes every CSS variable to its fallback', () => {
  const out = forRaster(avatar)
  expect(out).not.toContain('var(')
  expect(out).toContain('width="64" height="64"')
})

test('forRaster takes the avatar object or its string', () => {
  expect(forRaster(avatar)).toBe(forRaster(avatar.svg))
})

test('forRaster resizes only the root svg', () => {
  const out = forRaster(avatar, { size: 512 })
  expect(out.startsWith('<svg')).toBe(true)
  expect(out.match(/width="512" height="512"/g)).toHaveLength(1)
  expect(out).toContain('viewBox="0 0 100 100"')
})

test('forRaster applies theme vars and ignores unsafe values', () => {
  const svg = createAvatar(initials, { seed: 'ada' }).svg
  const fallback = /var\(--avatar-c1, (#\w+)\)/.exec(svg)![1]!
  expect(forRaster(svg, { vars: { '--avatar-c1': '#7c3aed' } })).toContain('fill="#7c3aed"')
  expect(forRaster(svg, { vars: { '--avatar-fg': 'rgb(1, 2, 3)' } })).toContain('rgb(1, 2, 3)')
  const hostile = forRaster(svg, { vars: { '--avatar-c1': '"/><script>x</script>' } })
  expect(hostile).not.toContain('<script')
  expect(hostile).toContain(`fill="${fallback}"`)
  // Inherited keys are not vars.
  expect(forRaster(svg, { vars: Object.create({ '--avatar-c1': 'red' }) })).toContain(fallback)
})

test.each([0, -1, NaN, Infinity])('forRaster rejects size %s', (size) => {
  expect(() => forRaster(avatar, { size })).toThrow(RangeError)
})
