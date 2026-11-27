/** Every Opaline style, in the order of `STYLES` in packages/contract. One source for every page. */
export type Kind = 'character' | 'abstract' | 'person' | 'text'
export type StyleInfo = {
  id: string
  name: string
  /** A few words, for pickers. */
  hint: string
  /** One sentence, for lists and the styles page. */
  blurb: string
  kind: Kind
  since: string
  /** Options only this style (or a few) reads, beyond the shared ones. */
  options: string[]
}

export const STYLE_INFO: StyleInfo[] = [
  {
    id: 'morph',
    name: 'Morph',
    hint: 'Blob with a face',
    blurb: 'An organic blob with a face.',
    kind: 'abstract',
    since: '0.2',
    options: ['family', 'finish', 'expression', 'backdrop'],
  },
  {
    id: 'gradient',
    name: 'Gradient',
    hint: 'Smooth and expressive',
    blurb: 'Smooth shapes with expressive faces.',
    kind: 'abstract',
    since: '0.2',
    options: ['form', 'family', 'finish', 'expression'],
  },
  {
    id: 'aura',
    name: 'Aura',
    hint: 'Glowing orb',
    blurb: 'A glowing orb of blended color. No face, just light.',
    kind: 'abstract',
    since: '0.2',
    options: ['shape'],
  },
  {
    id: 'clay',
    name: 'Clay',
    hint: 'Little characters',
    blurb: 'Little characters: a jelly body, or a hood with cat, bear or bunny ears.',
    kind: 'character',
    since: '0.4',
    options: ['body', 'ears', 'finish', 'expression'],
  },
  {
    id: 'initials',
    name: 'Initials',
    hint: 'Letters on a tile',
    blurb: 'Readable letters on a seeded tile, WCAG AA on every palette.',
    kind: 'text',
    since: '1.1',
    options: ['text', 'shape'],
  },
  {
    id: 'plush',
    name: 'Plush',
    hint: 'Gummy critters',
    blurb: 'Gummy critters, now and then wearing a hat, glasses or a flower.',
    kind: 'character',
    since: '1.2',
    options: ['accessory', 'finish', 'expression'],
  },
  {
    id: 'pip',
    name: 'Pip',
    hint: 'Shapes with pill eyes',
    blurb: 'Bold geometric shapes with two pill eyes. Reads well at 24px.',
    kind: 'abstract',
    since: '1.2',
    options: ['form', 'finish'],
  },
  {
    id: 'critters',
    name: 'Critters',
    hint: 'Vinyl-toy animals',
    blurb: 'Soft vinyl-toy animals, nineteen of them, in natural coats or your palette.',
    kind: 'character',
    since: '1.3',
    options: ['animal', 'coat', 'finish', 'expression'],
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    hint: 'Glowing space objects',
    blurb: 'Glowing pastel space objects. On a tile they sit on a night sky.',
    kind: 'abstract',
    since: '1.3',
    options: ['object', 'tone', 'shape'],
  },
  {
    id: 'folk',
    name: 'Folk',
    hint: 'People with personality',
    blurb: 'Head-and-shoulders people with funny, moody or cocky faces.',
    kind: 'person',
    since: '1.3',
    options: ['expression', 'scheme', 'shape'],
  },
  {
    id: 'doodle',
    name: 'Doodle',
    hint: 'Face-only line drawing',
    blurb: 'Face-only line drawings with big, expressive features and a colour look.',
    kind: 'person',
    since: '1.3',
    options: ['expression', 'scheme', 'shape'],
  },
]

export const KINDS: [Kind, string][] = [
  ['character', 'Characters'],
  ['abstract', 'Shapes and light'],
  ['person', 'People'],
  ['text', 'Letters'],
]

export const NEWEST = '1.3'

const FACES = [
  'grin',
  'beam',
  'laugh',
  'hearts',
  'starry',
  'wink',
  'cheeky',
  'whistle',
  'smug',
  'cool',
  'boss',
  'meh',
  'chill',
  'thinking',
  'moody',
  'dreamy',
  'shook',
  'oops',
]

/** The one option each style is known for, with every value it takes. The Styles page draws them all. */
export const RANGES: Record<string, { option: string; values: string[] }> = {
  morph: {
    option: 'family',
    values: ['egg', 'duo', 'tri', 'cushion', 'clover', 'petal', 'star', 'drop', 'bloom'],
  },
  gradient: {
    option: 'form',
    values: ['pebble', 'bean', 'cloud', 'leaf', 'shell', 'wave', 'bun', 'kite', 'cushion'],
  },
  aura: {
    option: 'palette',
    values: ['vivid', 'pastel', 'electric', 'muted', 'warm', 'cool', 'mono'],
  },
  clay: { option: 'body', values: ['jelly', 'hood', 'ghost'] },
  initials: { option: 'shape', values: ['circle', 'squircle', 'square'] },
  plush: {
    option: 'accessory',
    values: [
      'beret',
      'cap',
      'beanie',
      'glasses',
      'shades',
      'flower',
      'sprout',
      'bow',
      'star',
      'pumpkin',
      'party',
      'headphones',
      'crown',
    ],
  },
  pip: {
    option: 'form',
    values: [
      'circle',
      'squircle',
      'triangle',
      'hexagon',
      'diamond',
      'heart',
      'drop',
      'pill',
      'dome',
      'star',
      'clover',
      'shield',
      'octagon',
      'ghost',
    ],
  },
  critters: {
    option: 'animal',
    values: [
      'cat',
      'sloth',
      'dog',
      'hamster',
      'rabbit',
      'ferret',
      'fox',
      'panda',
      'koala',
      'penguin',
      'deer',
      'frog',
      'owl',
      'chick',
      'axolotl',
      'lion',
      'pig',
      'mouse',
      'octopus',
    ],
  },
  cosmos: {
    option: 'object',
    values: [
      'sun',
      'galaxy',
      'black hole',
      'nebula',
      'comet',
      'moon',
      'crescent',
      'star',
      'quasar',
      'pulsar',
      'ufo',
      'rocket',
      'asteroid',
      'supernova',
      'satellite',
    ],
  },
  folk: { option: 'expression', values: FACES },
  doodle: { option: 'expression', values: FACES },
}
