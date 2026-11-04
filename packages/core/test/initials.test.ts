import { expect, test } from 'vitest'
import { createAvatar } from '../src/index.ts'
import { initials, letters } from '../src/styles/initials.ts'

test('letters come from the seed: first and last word, upper-cased', () => {
  expect(letters('ada.lovelace@inlay.dev')).toBe('AL')
  expect(letters('Grace')).toBe('G')
  expect(letters('Zoë Nguyễn')).toBe('ZN')
  expect(letters('grace brewster murray hopper')).toBe('GH')
  expect(letters('42')).toBe('4')
  expect(letters('jean-luc_picard+work@x.io')).toBe('JW')
})

test('a seed with no letters or digits gives no letters', () => {
  expect(letters('😀')).toBe('')
  expect(letters('')).toBe('')
  expect(letters('   ')).toBe('')
  expect(letters('-- __')).toBe('')
})

test('text is used as given: trimmed, at most 3 code points', () => {
  expect(letters('x', '  acme co ')).toBe('acm')
  expect(letters('x', 'Op')).toBe('Op')
  expect(letters('x', '😀😀😀😀')).toBe('😀😀😀')
  expect(letters('ada lovelace', '   ')).toBe('AL')
})

test('hostile text and seeds are escaped', () => {
  const svg = createAvatar(initials, { seed: 'a', text: '<&>' }).svg
  expect(svg).toContain('&lt;&amp;&gt;')
  expect(svg).not.toContain('<&>')
  const q = createAvatar(initials, { seed: 'a', text: `"'` }).svg
  expect(q).toContain('>&quot;&#39;</text>')
})

test('no letters draws a plain tile without text', () => {
  const svg = createAvatar(initials, { seed: '😀' }).svg
  expect(svg).not.toContain('<text')
  expect(svg).toContain('var(--avatar-c1,')
  expect(createAvatar(initials, { seed: '😀' }).toJSON().text).toBe('')
})

test('font size: 40 for one or two letters, 30 for three', () => {
  expect(createAvatar(initials, { seed: 'ada lovelace' }).svg).toContain('font-size="40"')
  expect(createAvatar(initials, { seed: 'a', text: 'ACM' }).svg).toContain('font-size="30"')
})

test('letters are dark on pastel and white on vivid', () => {
  const fg = (svg: string) => /fill="var\(--avatar-fg, (#[0-9a-f]{3,6})\)"/.exec(svg)?.[1]
  expect(fg(createAvatar(initials, { seed: 'ada' }).svg)).toBe('#fff')
  const pastel = fg(createAvatar(initials, { seed: 'ada', palette: 'pastel' }).svg)
  expect(pastel).toMatch(/^#[0-9a-f]{6}$/)
  expect(pastel).not.toBe('#fff')
})

test('picks report the style, palette, shape and the letters drawn', () => {
  expect(createAvatar(initials, { seed: 'ada.lovelace@inlay.dev' }).toJSON()).toMatchObject({
    style: 'initials',
    palette: 'vivid',
    shape: 'circle',
    text: 'AL',
  })
})

test('every shape draws its own tile; unknown shapes fall back to circle', () => {
  const first = (svg: string) => /<path d="([^"]+)"/.exec(svg)?.[1]
  const tiles = (['circle', 'squircle', 'square', 'ellipse'] as const).map((shape) =>
    first(createAvatar(initials, { seed: 'a', shape }).svg),
  )
  expect(new Set(tiles).size).toBe(4)
  expect(first(createAvatar(initials, { seed: 'a', shape: 'nope' } as never).svg)).toBe(tiles[0])
})

test('the tile carries the opaline sheen', () => {
  expect(createAvatar(initials, { seed: 'a' }).svg).toContain('stop-opacity="0.42"')
})
