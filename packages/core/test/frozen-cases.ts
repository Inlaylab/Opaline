import type { Style } from '../src/index.ts'
import { aura } from '../src/styles/aura.ts'
import { clay } from '../src/styles/clay.ts'
import { gradient } from '../src/styles/gradient.ts'
import { morph } from '../src/styles/morph.ts'

/** 100 seeds in the shapes real apps pass: emails, names, IDs, numbers, unicode. */
export const FROZEN_SEEDS: readonly string[] = Array.from({ length: 100 }, (_, i) =>
  i % 5 === 0
    ? `user${i}@example.com`
    : i % 5 === 1
      ? `Person ${String.fromCharCode(65 + (i % 26))}${i}`
      : i % 5 === 2
        ? `id_${(i * 2654435761).toString(36)}`
        : i % 5 === 3
          ? String(i * 7919)
          : `Zoë Nguyễn ${i} 😀`,
)

const blob = [
  {},
  { finish: 'soft' },
  { finish: 'gloss' },
  { palette: 'pastel' },
  { expression: 'wink' },
  { backdrop: 'tint' },
  { family: 'petal' },
  { face: false },
]

/** Every style with the option sets whose output 1.x promises never to change. */
export const FROZEN: readonly (readonly [string, Style<any>, readonly object[]])[] = [
  ['morph', morph, blob],
  ['gradient', gradient, blob],
  ['aura', aura, [{}, { shape: 'squircle' }, { palette: 'mono' }]],
  [
    'clay',
    clay,
    [
      {},
      { finish: 'gloss' },
      { finish: 'flat' },
      { body: 'hood' },
      { body: 'hood', ears: 'bunny' },
      { palette: 'warm' },
    ],
  ],
]
