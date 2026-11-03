import { expect, test } from 'vitest'
import { createAvatar } from '../src/index.ts'
import { aura } from '../src/styles/aura.ts'
import { gradient } from '../src/styles/gradient.ts'
import { morph } from '../src/styles/morph.ts'

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
