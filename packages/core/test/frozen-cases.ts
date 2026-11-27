import type { Style } from '../src/index.ts'
import { aura } from '../src/styles/aura.ts'
import { clay } from '../src/styles/clay.ts'
import { cosmos } from '../src/styles/cosmos.ts'
import { critters } from '../src/styles/critters.ts'
import { doodle } from '../src/styles/doodle.ts'
import { folk } from '../src/styles/folk.ts'
import { gradient } from '../src/styles/gradient.ts'
import { initials } from '../src/styles/initials.ts'
import { morph } from '../src/styles/morph.ts'
import { pip } from '../src/styles/pip.ts'
import { plush } from '../src/styles/plush.ts'

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
  { shape: 'circle' },
  { shape: 'squircle' },
  { shape: 'square' },
]

/** Every style with the option sets whose output 1.x promises never to change. */
export const FROZEN: readonly (readonly [string, Style<any>, readonly object[]])[] = [
  ['morph', morph, blob],
  ['gradient', gradient, blob],
  ['aura', aura, [{}, { shape: 'squircle' }, { palette: 'mono' }, { shape: 'square' }]],
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
      { shape: 'circle' },
      { shape: 'squircle' },
      { shape: 'square' },
    ],
  ],
  [
    'initials',
    initials,
    [{}, { shape: 'squircle' }, { shape: 'square' }, { palette: 'pastel' }, { text: 'Op' }],
  ],
  [
    'plush',
    plush,
    [
      {},
      { accessory: 'none' },
      { accessory: 'glasses' },
      { accessory: 'beanie' },
      { palette: 'pastel' },
      { expression: 'wink' },
      { backdrop: 'tint' },
      { face: false },
      { shape: 'squircle' },
    ],
  ],
  [
    'pip',
    pip,
    [
      {},
      { finish: 'soft' },
      { finish: 'gloss' },
      { form: 'heart' },
      { palette: 'pastel' },
      { backdrop: 'tint' },
      { face: false },
      { shape: 'square' },
    ],
  ],
]

/** 1.3 additions, locked in their own manifest (`frozen-1.3.json`); `frozen-1.json` never changes. */
export const FROZEN_13: readonly (readonly [string, Style<any>, readonly object[]])[] = [
  [
    'morph',
    morph,
    [{ finish: 'gummy' }, { status: 'online' }, { family: 'bloom' }, { expression: 'cool' }],
  ],
  ['gradient', gradient, [{ finish: 'gummy' }, { form: 'bun' }, { form: 'leaf', finish: 'soft' }]],
  ['clay', clay, [{ body: 'ghost' }, { body: 'hood', ears: 'fox' }, { finish: 'gummy' }]],
  ['plush', plush, [{ material: 'flat' }, { material: 'soft' }, { accessory: 'crown' }]],
  ['pip', pip, [{ form: 'star' }, { finish: 'gummy' }]],
  [
    'critters',
    critters,
    [
      {},
      { animal: 'panda' },
      { coat: 'palette' },
      { finish: 'gummy' },
      { finish: 'gloss' },
      { mood: 'calm' },
      { shape: 'squircle' },
    ],
  ],
  [
    'cosmos',
    cosmos,
    [{}, { object: 'galaxy' }, { object: 'quasar', tone: 2 }, { face: false }, { shape: 'circle' }],
  ],
  [
    'folk',
    folk,
    [
      {},
      { scheme: 'natural' },
      { scheme: 'sepia' },
      { scheme: 'sunrise', shape: 'circle' },
      { shape: 'none' },
      { mood: 'attitude' },
    ],
  ],
  ['doodle', doodle, [{}, { scheme: 'inverted' }, { shape: 'squircle' }]],
]
