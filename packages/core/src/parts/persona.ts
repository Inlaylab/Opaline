import type { Rng } from '../prng.ts'
import { lch } from '../styles/paint.ts'
import { num } from '../svg.ts'
import { known } from './known.ts'
import { SHAPES, type Shape } from './tile.ts'

/**
 * The face set of the line-drawn styles (Folk, Doodle): funny, happy, moody or full of attitude,
 * never mocking. Checked sets of parts, like the face kit, so odd faces cannot happen.
 */
export type PersonaMood = 'happy' | 'playful' | 'attitude' | 'moody' | 'surprised'
export type PersonaExpression =
  | 'grin'
  | 'beam'
  | 'laugh'
  | 'hearts'
  | 'wink'
  | 'cheeky'
  | 'whistle'
  | 'smug'
  | 'cool'
  | 'boss'
  | 'meh'
  | 'moody'
  | 'dreamy'
  | 'shook'
  | 'starry'
  | 'chill'
  | 'thinking'
  | 'oops'
type LineEye =
  | 'dot'
  | 'side'
  | 'wide'
  | 'up'
  | 'arc'
  | 'lid'
  | 'half'
  | 'squintL'
  | 'squintR'
  | 'heart'
  | 'shades'
  | 'star'
type Brows = 'up' | 'flat' | 'high' | 'angry' | 'moody' | 'raise1'
type LineMouth =
  | 'grin'
  | 'smile'
  | 'smirk'
  | 'laugh'
  | 'tongue'
  | 'whistle'
  | 'set'
  | 'flatSide'
  | 'pout'
  | 'tiny'
  | 'o'
type Spec = {
  mood: PersonaMood
  eyes: [LineEye, LineEye]
  brows: Brows
  mouth: LineMouth
  blush?: 1
  sweat?: 1
}

export const PERSONA: Record<PersonaExpression, Spec> = {
  grin: { mood: 'happy', eyes: ['dot', 'dot'], brows: 'up', mouth: 'grin' },
  beam: { mood: 'happy', eyes: ['arc', 'arc'], brows: 'up', mouth: 'smile', blush: 1 },
  laugh: { mood: 'happy', eyes: ['squintL', 'squintR'], brows: 'up', mouth: 'laugh', blush: 1 },
  hearts: { mood: 'happy', eyes: ['heart', 'heart'], brows: 'up', mouth: 'grin', blush: 1 },
  wink: { mood: 'playful', eyes: ['dot', 'arc'], brows: 'raise1', mouth: 'smirk' },
  cheeky: { mood: 'playful', eyes: ['arc', 'arc'], brows: 'up', mouth: 'tongue', blush: 1 },
  whistle: { mood: 'playful', eyes: ['side', 'side'], brows: 'raise1', mouth: 'whistle' },
  smug: { mood: 'attitude', eyes: ['half', 'half'], brows: 'raise1', mouth: 'smirk' },
  cool: { mood: 'attitude', eyes: ['shades', 'shades'], brows: 'flat', mouth: 'smirk' },
  boss: { mood: 'attitude', eyes: ['dot', 'dot'], brows: 'angry', mouth: 'set' },
  meh: { mood: 'attitude', eyes: ['up', 'up'], brows: 'flat', mouth: 'flatSide' },
  moody: { mood: 'moody', eyes: ['half', 'half'], brows: 'moody', mouth: 'pout' },
  dreamy: { mood: 'moody', eyes: ['lid', 'lid'], brows: 'up', mouth: 'tiny', blush: 1 },
  shook: { mood: 'surprised', eyes: ['wide', 'wide'], brows: 'high', mouth: 'o' },
  starry: { mood: 'happy', eyes: ['star', 'star'], brows: 'up', mouth: 'grin', blush: 1 },
  chill: { mood: 'attitude', eyes: ['lid', 'lid'], brows: 'flat', mouth: 'smirk' },
  thinking: { mood: 'attitude', eyes: ['side', 'side'], brows: 'raise1', mouth: 'flatSide' },
  oops: { mood: 'surprised', eyes: ['wide', 'wide'], brows: 'high', mouth: 'set', sweat: 1 },
}
const NAMES = Object.keys(PERSONA) as PersonaExpression[]
export const PERSONA_MOODS: Record<PersonaMood, true> = {
  happy: true,
  playful: true,
  attitude: true,
  moody: true,
  surprised: true,
}

/**
 * The expression: always drawn from the mood's pool (minus `skip`), so a set expression keeps the
 * draws of the free one. `skip` leaves out faces a look must never get (tongue-out under a headscarf).
 */
export function pickPersona(
  g: Rng,
  opts: { mood?: unknown; expression?: unknown },
  skip: readonly PersonaExpression[] = [],
): PersonaExpression {
  const mood = known(PERSONA_MOODS, opts.mood)
  const pool = NAMES.filter((n) => (!mood || PERSONA[n].mood === mood) && !skip.includes(n))
  const drawn = g.pick(pool.length ? pool : NAMES)
  // A requested face the look must never get (in `skip`) falls back to the drawn one.
  const asked = known(PERSONA, opts.expression)
  return asked && !skip.includes(asked) ? asked : drawn
}

/** Colours a face is drawn with. `w` and `bw` thicken lines and brows on darker skin. */
export type Ink = { ink: string; skin: string; tongue: string; w?: number; bw?: number }

const stroke = (d: string, ink: string, w = 2.2) =>
  `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${num(w)}" stroke-linecap="round" stroke-linejoin="round"/>`
export { stroke as lineStroke }

function eye(kind: LineEye, x: number, c: Ink): string {
  const { ink, skin } = c
  const n = num
  switch (kind) {
    case 'dot':
      return `<circle cx="${n(x)}" cy="0" r="2.8" fill="${ink}"/><circle cx="${n(x - 0.9)}" cy="-0.9" r="0.8" fill="${skin}"/>`
    case 'side':
      return `<circle cx="${n(x + 1.6)}" cy="0" r="2.8" fill="${ink}"/>`
    case 'wide':
      return `<circle cx="${n(x)}" cy="0" r="4.3" fill="${skin}" stroke="${ink}" stroke-width="1.6"/><circle cx="${n(x)}" cy="0.4" r="1.7" fill="${ink}"/>`
    case 'up':
      return `<circle cx="${n(x)}" cy="0" r="4" fill="${skin}" stroke="${ink}" stroke-width="1.6"/><circle cx="${n(x + 0.6)}" cy="-1.9" r="1.8" fill="${ink}"/>`
    case 'arc':
      return stroke(`M${n(x - 3.6)} 1.2Q${n(x)} -3.4 ${n(x + 3.6)} 1.2`, ink, c.w)
    case 'lid':
      return stroke(`M${n(x - 3.6)} -0.6Q${n(x)} 3 ${n(x + 3.6)} -0.6`, ink, c.w)
    case 'half':
      return (
        `<path d="M${n(x - 3.4)} -0.6A3.4 3.4 0 0 0 ${n(x + 3.4)} -0.6Z" fill="${ink}"/>` +
        stroke(`M${n(x - 4.4)} -0.8L${n(x + 4.4)} -0.8`, ink, c.w)
      )
    case 'squintL':
      return stroke(`M${n(x - 3.4)} -2.8L${n(x + 2.6)} 0L${n(x - 3.4)} 2.8`, ink, c.w)
    case 'squintR':
      return stroke(`M${n(x + 3.4)} -2.8L${n(x - 2.6)} 0L${n(x + 3.4)} 2.8`, ink, c.w)
    case 'heart':
      return `<path d="M${n(x)} 3.6C${n(x - 1.4)} 2.6 ${n(x - 4.8)} 0.4 ${n(x - 4.2)} -2C${n(x - 3.6)} -4.2 ${n(x - 1)} -4.3 ${n(x)} -2.3C${n(x + 1)} -4.3 ${n(x + 3.6)} -4.2 ${n(x + 4.2)} -2C${n(x + 4.8)} 0.4 ${n(x + 1.4)} 2.6 ${n(x)} 3.6Z" fill="#e2456f"/>`
    case 'star':
      return `<path d="M${n(x)} -4.2Q${n(x + 0.9)} -0.9 ${n(x + 4.2)} 0Q${n(x + 0.9)} 0.9 ${n(x)} 4.2Q${n(x - 0.9)} 0.9 ${n(x - 4.2)} 0Q${n(x - 0.9)} -0.9 ${n(x)} -4.2Z" fill="${ink}"/>`
    case 'shades':
      return (
        `<path d="M${n(x - 6)} -3.2H${n(x + 6)}Q${n(x + 6.2)} 3.4 ${n(x)} 4Q${n(x - 6.2)} 3.4 ${n(x - 6)} -3.2Z" fill="${ink}"/>` +
        `<path d="M${n(x - 3.6)} 1.2L${n(x - 1)} -2" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".75"/>` +
        (x < 0 ? stroke(`M${n(x + 6)} -2.6L${n(-x - 6)} -2.6`, ink, 1.8) : '')
      )
  }
}

function brows(kind: Brows, s: number, ink: string, w = 2.2): string {
  const one = (k: number, type: Brows) => {
    const x = k * s
    const n = num
    if (type === 'up') return stroke(`M${n(x - 4)} -7.6Q${n(x)} -10.2 ${n(x + 4)} -7.6`, ink, w)
    if (type === 'flat') return stroke(`M${n(x - 4)} -8.4L${n(x + 4)} -8.4`, ink, w)
    if (type === 'high') return stroke(`M${n(x - 4)} -10.6Q${n(x)} -13.4 ${n(x + 4)} -10.6`, ink, w)
    if (type === 'angry') return stroke(`M${n(x + k * 4)} -10.6L${n(x - k * 4)} -7.4`, ink, w)
    return stroke(`M${n(x + k * 4)} -9.6L${n(x - k * 4)} -7.8`, ink, w)
  }
  return kind === 'raise1' ? one(-1, 'flat') + one(1, 'high') : one(-1, kind) + one(1, kind)
}

function mouth(kind: LineMouth, c: Ink): string {
  const { ink, tongue } = c
  switch (kind) {
    case 'grin':
      return `<path d="M-5.5 10.5Q0 11.5 5.5 10.5Q4.8 17.5 0 17.5Q-4.8 17.5 -5.5 10.5Z" fill="${ink}"/><path d="M-4.8 11.2Q0 12.1 4.8 11.2L4.5 12.9Q0 13.6 -4.5 12.9Z" fill="#fff"/>`
    case 'smile':
      return stroke('M-5 11Q0 16 5 11', ink, c.w)
    case 'smirk':
      return stroke('M-4 12.8Q1.5 14.6 5.2 10.4', ink, c.w)
    case 'laugh':
      return `<path d="M-6.5 10Q0 11.4 6.5 10Q5.6 19.5 0 19.5Q-5.6 19.5 -6.5 10Z" fill="${ink}"/><ellipse cx="0" cy="17" rx="3.4" ry="1.9" fill="${tongue}"/>`
    case 'tongue':
      return (
        stroke('M-5 11Q0 15.4 5 11', ink, c.w) +
        `<path d="M-0.4 13.2Q0 18 2.8 17.6Q4.6 17 3.6 12.4Z" fill="${tongue}" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>`
      )
    case 'whistle':
      return `<circle cx="2.4" cy="13.4" r="1.9" fill="none" stroke="${ink}" stroke-width="1.8"/>`
    case 'set':
      return `<path d="M-5 11.5L5 11.5Q4.6 15.6 0 15.6Q-4.6 15.6 -5 11.5Z" fill="${ink}"/><path d="M-4.6 11.9L4.6 11.9L4.4 13.2L-4.4 13.2Z" fill="#fff"/>`
    case 'flatSide':
      return stroke('M-3.4 13.4L3.8 12.4', ink, c.w)
    case 'pout':
      return stroke('M-3.2 14Q0 12 3.2 14', ink, c.w)
    case 'tiny':
      return stroke('M-2.8 12.6Q0 14.8 2.8 12.6', ink, c.w)
    case 'o':
      return `<ellipse cx="0" cy="13.6" rx="2.4" ry="3" fill="${ink}"/>`
  }
}

/**
 * The face in its own frame: eyes at ±`s` on y 0, brows near y -8, mouth near y 12. `blush` draws
 * the pink cheeks of expressions that have them; `browW` sets the brow weight.
 */
export function personaFace(
  expression: PersonaExpression,
  s: number,
  c: Ink,
  { blush = true, browW }: { blush?: boolean; browW?: number } = {},
): { cheeks: string; eyes: string; mouth: string; shades: boolean } {
  const E = PERSONA[expression]
  const n = num
  const cheeks =
    blush && E.blush
      ? `<ellipse cx="${n(-s - 3.4)}" cy="6.6" rx="3.4" ry="2" fill="#ff8fa3" opacity=".5"/><ellipse cx="${n(s + 3.4)}" cy="6.6" rx="3.4" ry="2" fill="#ff8fa3" opacity=".5"/>`
      : ''
  const sweat = E.sweat
    ? `<path d="M${n(s + 7)} -9Q${n(s + 9.6)} -4.6 ${n(s + 7)} -3.4Q${n(s + 4.4)} -4.6 ${n(s + 7)} -9Z" fill="#8fd3ff" stroke="${c.ink}" stroke-width="1"/>`
    : ''
  return {
    cheeks,
    eyes:
      eye(E.eyes[0], -s, c) +
      eye(E.eyes[1], s, c) +
      brows(E.brows, s, c.ink, browW ?? c.bw) +
      sweat,
    mouth: mouth(E.mouth, c),
    shades: E.eyes[0] === 'shades',
  }
}

// ---- Colour schemes: a whole look in one word ----

/**
 * `natural` draws skin, hair and clothes in natural colours on a soft tint. Line schemes recolour
 * ink, skin, hair and clothes; wall schemes (`pastel`, `bold`, `sunrise`) leave the drawing black on
 * white and change only what is behind it.
 */
export type Scheme =
  | 'natural'
  | 'bare'
  | 'sepia'
  | 'greyscale'
  | 'duotone'
  | 'muted'
  | 'electric'
  | 'inverted'
  | 'pastel'
  | 'bold'
  | 'sunrise'
type Line = {
  ink: string
  skin: string
  hair: readonly string[]
  cloth: string
  cloth2: string
  bg: string | null
  tongue?: string
}
const LINE: Partial<Record<Scheme, Line>> = {
  bare: {
    ink: '#16151c',
    skin: '#ffffff',
    hair: ['#16151c'],
    cloth: '#ffffff',
    cloth2: '#ffffff',
    bg: null,
  },
  sepia: {
    ink: '#4a3424',
    skin: '#f6ead6',
    hair: ['#4a3424'],
    cloth: '#ead9bc',
    cloth2: '#dcc6a2',
    bg: '#e3cfae',
  },
  greyscale: {
    ink: '#2c2c32',
    skin: '#fafafb',
    hair: ['#3b3b42'],
    cloth: '#e4e4e8',
    cloth2: '#cfcfd6',
    bg: '#ececef',
  },
  muted: {
    ink: '#1d1b26',
    skin: '#fbf8f3',
    hair: ['#a8ad8c', '#bd8f76', '#98a6b4', '#b39ab0', '#c4b287', '#8d9b88'],
    cloth: '#f4f0e8',
    cloth2: '#ddd6c8',
    bg: '#ebe6dd',
  },
  electric: {
    ink: '#121117',
    skin: '#f6f4fa',
    hair: ['#ff6a1a', '#ffe14a', '#ff4fa3', '#3fd0ff', '#8c5bff', '#3ee08a'],
    cloth: '#f6f4fa',
    cloth2: '#d9d6e2',
    bg: '#121117',
  },
  inverted: {
    ink: '#f4f2f8',
    skin: '#141318',
    hair: ['#f4f2f8'],
    cloth: '#141318',
    cloth2: '#2a2833',
    bg: '#141318',
    tongue: '#2a2833',
  },
}
const WALLS: Partial<Record<Scheme, readonly string[]>> = {
  pastel: ['#efe4ff', '#dff3ea', '#e3ecff', '#ffe9dc', '#fff3c9'],
  bold: ['#ff8a4c', '#3fae8a', '#5b8cff', '#b06bff', '#ff6f91'],
  sunrise: ['sunrise'],
}
export const SCHEMES: Record<Scheme, true> = {
  natural: true,
  bare: true,
  sepia: true,
  greyscale: true,
  duotone: true,
  muted: true,
  electric: true,
  inverted: true,
  pastel: true,
  bold: true,
  sunrise: true,
}
// Six skin tones, given equal weight, and natural hair.
const SKINS = [
  [0.93, 0.035, 65],
  [0.86, 0.055, 60],
  [0.77, 0.075, 55],
  [0.67, 0.085, 48],
  [0.56, 0.08, 42],
  [0.45, 0.065, 38],
] as const
const HAIRS = [
  [0.27, 0.02, 40],
  [0.36, 0.04, 50],
  [0.48, 0.08, 55],
  [0.63, 0.1, 70],
  [0.8, 0.1, 88],
  [0.74, 0.01, 280],
  [0.56, 0.14, 40],
] as const

export type Colors = Ink & {
  hair: string
  cloth: string
  cloth2: string
  /** The wall: a colour, `sunrise`, or null for none. */
  bg: string | null
  blush: boolean
  flat: boolean
}

/** One avatar's colours. Every draw is always taken, so a scheme never shifts the person. */
export function schemeColors(g: Rng, scheme: Scheme, hue: number): Colors {
  const skin = g.pick(SKINS)
  const hair = g.pick(HAIRS)
  const clothH = hue + g.float(-30, 30)
  const wallPick = g.next()
  const hairPick = g.next()
  const nat: Colors = {
    ink: '#1f1c2a',
    skin: lch(skin[0], skin[1], skin[2]),
    hair: lch(hair[0], hair[1], hair[2]),
    cloth: lch(0.76, 0.11, clothH),
    cloth2: lch(0.64, 0.12, clothH + 40),
    bg: lch(0.95, 0.03, hue),
    blush: true,
    flat: false,
    tongue: lch(0.7, 0.15, 15),
  }
  // Darker skin: near-black ink and thicker lines, so brows, eyes and mouth keep their contrast.
  if (skin[0] < 0.62) Object.assign(nat, { ink: '#0b080c', w: 2.8, bw: 3 })
  const walls = WALLS[scheme]
  if (walls)
    return {
      ...nat,
      ink: '#16151c',
      skin: '#ffffff',
      hair: '#16151c',
      cloth: '#ffffff',
      cloth2: '#ffffff',
      flat: true,
      w: undefined,
      bw: undefined,
      bg: walls[Math.floor(wallPick * walls.length)]!,
    }
  // Duotone follows the seed's palette hue, so a person keeps their colour across styles.
  const t =
    scheme === 'duotone'
      ? {
          ink: lch(0.3, 0.07, hue),
          skin: lch(0.98, 0.012, hue),
          hair: [lch(0.3, 0.07, hue)],
          cloth: lch(0.9, 0.05, hue),
          cloth2: lch(0.3, 0.07, hue),
          bg: lch(0.93, 0.04, hue),
        }
      : LINE[scheme]
  if (!t) return nat
  return {
    ...nat,
    ink: t.ink,
    skin: t.skin,
    hair: t.hair[Math.floor(hairPick * t.hair.length)]!,
    cloth: t.cloth,
    cloth2: t.cloth2,
    bg: t.bg,
    blush: false,
    flat: true,
    w: undefined,
    bw: undefined,
    tongue: t.tongue ?? '#ff8fa3',
  }
}

/** The wall behind the drawing; `sunrise` is a warm gradient. Pushes any defs it needs. */
export function wall(bg: string | null, defs: string[], id: (name: string) => string): string {
  if (!bg) return ''
  if (bg !== 'sunrise') return `<rect width="100" height="100" fill="${bg}"/>`
  defs.push(
    `<linearGradient id="${id('sun')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd9a6"/><stop offset="1" stop-color="#ffa9c4"/></linearGradient>`,
  )
  return `<rect width="100" height="100" fill="url(#${id('sun')})"/>`
}

/** `none` drops the tile and its wall; `circle`, `squircle` and `square` clip the whole avatar to it. */
export type PersonaShape = Shape | 'none'

/** The avatar in its tile. Without a wall, a tile gets `fallback` behind it (null: none). */
export function tiled(
  wallSvg: string,
  body: string,
  defs: string[],
  id: (name: string) => string,
  shape: unknown,
  fallback: string | null,
): string {
  if (shape === 'none') return body
  const s = known(SHAPES, shape) ?? 'square'
  const w = wallSvg || (fallback ? `<rect width="100" height="100" fill="${fallback}"/>` : '')
  defs.push(`<clipPath id="${id('tile')}"><path d="${SHAPES[s]}"/></clipPath>`)
  return `<g clip-path="url(#${id('tile')})">${w}${body}</g>`
}
