import { expect, test } from 'vitest'
import { createAvatar } from '../src/index.ts'
import { aura } from '../src/styles/aura.ts'
import { clay } from '../src/styles/clay.ts'
import { gradient } from '../src/styles/gradient.ts'
import { initials } from '../src/styles/initials.ts'
import { morph } from '../src/styles/morph.ts'
import { pip } from '../src/styles/pip.ts'
import { plush } from '../src/styles/plush.ts'

const seeds = ['ada@inlay.dev', 'Grace', '42', 'Zoë']
const cases = [
  [morph, { finish: 'flat', palette: 'vivid', face: true, backdrop: 'none' }],
  [gradient, { finish: 'flat', palette: 'vivid', face: true, backdrop: 'none' }],
  [clay, { finish: 'soft', palette: 'vivid', face: true, backdrop: 'none' }],
  [aura, { palette: 'vivid', shape: 'circle' }],
  [initials, { palette: 'vivid', shape: 'circle' }],
  [plush, { palette: 'vivid', face: true, backdrop: 'none' }],
  [pip, { palette: 'vivid', face: true, finish: 'flat', backdrop: 'none' }],
] as const

for (const [style, defaults] of cases)
  for (const [key, value] of Object.entries(defaults))
    test(`${style.name}: ${key}: ${JSON.stringify(value)} gives exactly the unset output`, () => {
      for (const seed of seeds)
        expect(createAvatar(style, { seed, [key]: value } as never).svg).toBe(
          createAvatar(style, { seed }).svg,
        )
    })

test('option order never matters', () => {
  const a = createAvatar(clay, { seed: 'a', body: 'hood', finish: 'gloss', palette: 'cool' }).svg
  const b = createAvatar(clay, { palette: 'cool', finish: 'gloss', seed: 'a', body: 'hood' }).svg
  expect(a).toBe(b)
})

test('a numeric seed equals its string form in every style', () => {
  for (const style of [morph, gradient, aura, clay, initials, plush, pip])
    expect(createAvatar(style, { seed: 42 }).svg).toBe(createAvatar(style, { seed: '42' }).svg)
})
