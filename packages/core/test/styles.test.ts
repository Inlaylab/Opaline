import { expect, test } from 'vitest'
import { createAvatar } from '../src/index.ts'
import { aura } from '../src/styles/aura.ts'
import { gradient } from '../src/styles/gradient.ts'
import { morph } from '../src/styles/morph.ts'
import { clay } from '../src/styles/clay.ts'

const bodyPath = (svg: string) => /<path d="(M[^"]+)"/.exec(svg)?.[1]

test('face: false drops the face and its pick', () => {
  for (const style of [morph, gradient]) {
    const a = createAvatar(style, { seed: 'a', face: false })
    expect(a.svg).not.toContain('fill="#fff"')
    expect(a.toJSON()).not.toHaveProperty('expression')
  }
})

test('faces are on by default with an expression pick', () => {
  expect(createAvatar(morph, { seed: 'a' }).toJSON()).toHaveProperty('expression')
})

test('aura never has a face', () => {
  const a = createAvatar(aura, { seed: 'a' })
  expect(a.toJSON()).not.toHaveProperty('expression')
  expect(a.svg).not.toContain('scale(')
})

test('gradient and aura carry the opaline sheen, morph has no gradients', () => {
  expect(createAvatar(gradient, { seed: 'a' }).svg).toContain('stop-opacity="0.42"')
  expect(createAvatar(aura, { seed: 'a' }).svg).toContain('stop-opacity="0.42"')
  expect(createAvatar(morph, { seed: 'a' }).svg).not.toContain('radialGradient')
})

test('tint backdrop adds a full circle before the body, not on aura', () => {
  const svg = createAvatar(morph, { seed: 'a', backdrop: 'tint' }).svg
  expect(svg).toMatch(
    /aria-hidden="true"><circle cx="50" cy="50" r="50" fill="var\(--avatar-bg, #[0-9a-f]{6}\)"\/><path/,
  )
  expect(createAvatar(aura, { seed: 'a', backdrop: 'tint' } as never).svg).not.toContain(
    '--avatar-bg',
  )
})

test('defaults: vivid palette, circle aura', () => {
  expect(createAvatar(morph, { seed: 'a' }).toJSON()).toMatchObject({ palette: 'vivid' })
  expect(createAvatar(aura, { seed: 'a' }).toJSON()).toMatchObject({
    palette: 'vivid',
    shape: 'circle',
  })
})

test('aura squircle has no rim', () => {
  const svg = createAvatar(aura, { seed: 'a', shape: 'squircle' }).svg
  expect(svg).not.toContain('stroke-opacity')
  expect(createAvatar(aura, { seed: 'a' }).svg).toContain('stroke-opacity="0.28"')
})

test('changing face options never moves the shape', () => {
  const on = createAvatar(morph, { seed: 'a' }).svg
  const off = createAvatar(morph, { seed: 'a', face: false }).svg
  const calm = createAvatar(morph, { seed: 'a', mood: 'calm' }).svg
  expect(bodyPath(off)).toBe(bodyPath(on))
  expect(bodyPath(calm)).toBe(bodyPath(on))
})

test('body color is --avatar-c1', () => {
  expect(createAvatar(morph, { seed: 'a' }).svg).toMatch(
    /<path d="M[^"]+" fill="var\(--avatar-c1, #[0-9a-f]{6}\)"/,
  )
})

test('unknown option strings fall back to defaults instead of throwing', () => {
  const plain = createAvatar(morph, { seed: 'a' }).toJSON()
  for (const bad of ['nope', '__proto__', 'constructor', 'toString']) {
    const opts = { seed: 'a', palette: bad, mood: bad, expression: bad, family: bad } as never
    const a = createAvatar(morph, opts)
    expect(a.toJSON()).toMatchObject({ palette: 'vivid', hue: plain.hue })
    expect(() => createAvatar(aura, { seed: 'a', palette: bad, shape: bad } as never)).not.toThrow()
  }
})

test('an unknown mood picks from all expressions', () => {
  const free = createAvatar(morph, { seed: 'a' }).toJSON()
  expect(createAvatar(morph, { seed: 'a', mood: 'angry' } as never).toJSON().expression).toBe(
    free.expression,
  )
})

test('aura draws a square tile and reports the shape', () => {
  const first = (svg: string) => /<path d="([^"]+)"/.exec(svg)?.[1]
  const circle = first(createAvatar(aura, { seed: 'a' }).svg)
  const square = createAvatar(aura, { seed: 'a', shape: 'square' })
  expect(first(square.svg)).toBe('M0 0H100V100H0Z')
  expect(first(square.svg)).not.toBe(circle)
  expect(square.toJSON().shape).toBe('square')
  expect(square.svg).not.toContain('stroke-opacity')
})

test('aura falls back to the circle for an unknown shape', () => {
  const strip = (s: string) => s.replace(/a[0-9a-z]{7}-/g, 'ID-')
  for (const bad of ['nope', '__proto__', 'constructor', 'ellipse'])
    expect(strip(createAvatar(aura, { seed: 'a', shape: bad } as never).svg)).toBe(
      strip(createAvatar(aura, { seed: 'a' }).svg),
    )
})

const ids = (s: string) => s.replace(/a[0-9a-z]{7}-/g, 'ID-')
const tint = /fill="var\(--avatar-bg, #[0-9a-f]{3,6}\)"/

for (const style of [morph, gradient, clay]) {
  test(`${style.name}: a set shape draws the tint tile in that shape, before the body`, () => {
    const svg = createAvatar(style, { seed: 'a', shape: 'square' }).svg
    expect(svg).toMatch(
      /aria-hidden="true">(<defs>.*<\/defs>)?<path d="M0 0H100V100H0Z" fill="var\(--avatar-bg, #[0-9a-f]{6}\)"\/>/,
    )
    expect(createAvatar(style, { seed: 'a', shape: 'squircle' }).svg).toContain(
      '<path d="M50 0C88 0 100 12 100 50S88 100 50 100 0 88 0 50 12 0 50 0Z" fill="var(--avatar-bg,',
    )
  })

  test(`${style.name}: circle draws the 1.0 tint circle; no shape draws no tile`, () => {
    const circle = createAvatar(style, { seed: 'a', shape: 'circle' })
    expect(ids(circle.svg)).toBe(ids(createAvatar(style, { seed: 'a', backdrop: 'tint' }).svg))
    expect(circle.toJSON().shape).toBe('circle')
    expect(createAvatar(style, { seed: 'a' }).svg).not.toMatch(tint)
  })

  test(`${style.name}: backdrop none with a shape still draws the tile`, () => {
    expect(createAvatar(style, { seed: 'a', shape: 'square', backdrop: 'none' }).svg).toBe(
      createAvatar(style, { seed: 'a', shape: 'square' }).svg,
    )
  })

  test(`${style.name}: a shape never moves the body or the other picks`, () => {
    const plain = createAvatar(style, { seed: 'a' })
    for (const shape of ['circle', 'squircle', 'square'] as const) {
      const a = createAvatar(style, { seed: 'a', shape })
      const { shape: s, ...rest } = a.toJSON()
      expect(s).toBe(shape)
      expect(rest).toEqual(plain.toJSON())
      expect(ids(a.svg).replace(/<(circle|path) [^>]*--avatar-bg[^>]*\/>/, '')).toBe(ids(plain.svg))
    }
  })

  test(`${style.name}: an unknown shape draws no tile and never throws`, () => {
    for (const bad of ['nope', '__proto__', 'constructor', 'ellipse']) {
      const a = createAvatar(style, { seed: 'a', shape: bad } as never)
      expect(ids(a.svg)).toBe(ids(createAvatar(style, { seed: 'a' }).svg))
      expect(a.toJSON()).not.toHaveProperty('shape')
    }
  })

  test(`${style.name}: two shapes of one seed never share gradient IDs`, () => {
    const prefix = (svg: string) => /id="(a[0-9a-z]+)-/.exec(svg)?.[1]
    const a = prefix(createAvatar(style, { seed: 'a', shape: 'square', finish: 'gloss' }).svg)
    const b = prefix(createAvatar(style, { seed: 'a', shape: 'squircle', finish: 'gloss' }).svg)
    expect(a).toBeDefined()
    expect(a).not.toBe(b)
  })
}
