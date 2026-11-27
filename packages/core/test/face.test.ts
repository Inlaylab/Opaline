import { expect, test } from 'vitest'
import { oklchToHex } from '../src/color.ts'
import { createRng } from '../src/prng.ts'
import { EXPRESSIONS, JOLLY, LEGACY_EXPRESSIONS, face, type Expression } from '../src/parts/face.ts'

const at = { x: 50, y: 50, r: 30, hue: 200 }

test('20 expressions grouped by mood as in the spec', () => {
  const byMood: Record<string, string[]> = {}
  for (const [name, e] of Object.entries(EXPRESSIONS)) (byMood[e.mood] ??= []).push(name)
  expect(byMood).toEqual({
    happy: ['beam', 'content', 'proud', 'starry', 'love', 'laugh', 'cool', 'nice'],
    calm: ['dreamy', 'hmm', 'shy', 'sleepy', 'yawn'],
    surprised: ['curious', 'oh', 'wow'],
    playful: ['cheeky', 'wink', 'giggle', 'smug'],
  })
})

test('free and mood picks stay in the 1.2 set unless a pool is given', () => {
  for (let i = 0; i < 300; i++) {
    expect(LEGACY_EXPRESSIONS).toContain(face(createRng('f' + i), at, {}).expression)
    expect(LEGACY_EXPRESSIONS).toContain(face(createRng('f' + i), at, { mood: 'happy' }).expression)
    expect(JOLLY).toContain(face(createRng('f' + i), at, { pool: JOLLY }).expression)
    expect(
      EXPRESSIONS[face(createRng('f' + i), at, { pool: JOLLY, mood: 'calm' }).expression].mood,
    ).toBe('calm')
  }
})

test('blush: true adds blush to an expression without it', () => {
  const n = (s: string) => (s.match(/<ellipse/g) ?? []).length
  const plain = face(createRng('b'), at, { expression: 'wink' }).svg
  expect(n(face(createRng('b'), at, { expression: 'wink', blush: true }).svg)).toBe(n(plain) + 2)
})

test.each(Object.keys(EXPRESSIONS) as Expression[])('%s renders without NaN', (name) => {
  expect(face(createRng('n'), at, { expression: name }).svg).not.toMatch(/NaN|undefined/)
})

test('mood narrows the expressions', () => {
  for (let i = 0; i < 200; i++) {
    const { expression } = face(createRng('m' + i), at, { mood: 'calm' })
    expect(['dreamy', 'hmm', 'shy', 'sleepy']).toContain(expression)
  }
})

test('a forced expression is used', () => {
  for (let i = 0; i < 20; i++)
    expect(face(createRng('w' + i), at, { expression: 'wink' }).expression).toBe('wink')
})

test('forcing an expression keeps spread and tilt', () => {
  const free = face(createRng('k'), at, {})
  const forced = face(createRng('k'), at, { expression: free.expression })
  expect(forced.svg).toBe(free.svg)
})

test.each([...LEGACY_EXPRESSIONS])('%s: two catch-lights per open eye', (name) => {
  const { svg } = face(createRng('c'), at, { expression: name })
  const open = EXPRESSIONS[name].eyes.filter((e) => e === 'dot' || e === 'round').length
  const catchLights = [...svg.matchAll(/<circle [^>]*r="([\d.]+)" fill="#fff"/g)].filter(
    (m) => Number(m[1]) < 3,
  )
  expect(catchLights).toHaveLength(open * 2)
})

test('ink is a dark shade of the body hue, never pure black', () => {
  const { svg } = face(createRng('i'), at, { expression: 'beam' })
  expect(svg).not.toContain('#000000')
  expect(svg).toContain(oklchToHex({ l: 0.24, c: 0.035, h: 200 }))
})

test('face sits slightly above the inscribed center', () => {
  const { svg } = face(createRng('p'), at, {})
  expect(svg).toMatch(/translate\(50 47\.6\)/)
})
