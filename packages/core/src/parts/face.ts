import { oklchToHex } from '../color.ts'
import type { Rng } from '../prng.ts'
import { el, num } from '../svg.ts'
import { known } from './known.ts'

export type Mood = 'happy' | 'calm' | 'surprised' | 'playful'
export type Eye = 'round' | 'dot' | 'arc' | 'lid'
export type Mouth = 'smile' | 'small' | 'flat' | 'cat' | 'o' | 'grin' | 'tongue'
export type Expression =
  | 'beam'
  | 'content'
  | 'proud'
  | 'dreamy'
  | 'hmm'
  | 'shy'
  | 'sleepy'
  | 'curious'
  | 'oh'
  | 'cheeky'
  | 'wink'
  | 'giggle'
type Spec = {
  mood: Mood
  eyes: [Eye, Eye]
  mouth: Mouth
  blush?: number
  brow?: 'raise' | 'flat'
  look?: [number, number]
}

/** Checked sets of parts. Users pick a mood or an expression, never single parts. */
export const EXPRESSIONS: Record<Expression, Spec> = {
  beam: { mood: 'happy', eyes: ['dot', 'dot'], mouth: 'grin', blush: 1 },
  content: { mood: 'happy', eyes: ['arc', 'arc'], mouth: 'smile', blush: 1 },
  proud: { mood: 'happy', eyes: ['arc', 'arc'], mouth: 'grin', brow: 'raise' },
  dreamy: { mood: 'calm', eyes: ['lid', 'lid'], mouth: 'small', blush: 1 },
  hmm: { mood: 'calm', eyes: ['dot', 'dot'], mouth: 'flat', look: [1.6, 0], brow: 'flat' },
  shy: { mood: 'calm', eyes: ['dot', 'dot'], mouth: 'small', look: [0, 1.4], blush: 1.5 },
  sleepy: { mood: 'calm', eyes: ['lid', 'lid'], mouth: 'o' },
  curious: {
    mood: 'surprised',
    eyes: ['round', 'round'],
    mouth: 'o',
    look: [1.8, -1],
    brow: 'raise',
  },
  oh: { mood: 'surprised', eyes: ['round', 'round'], mouth: 'o' },
  cheeky: { mood: 'playful', eyes: ['dot', 'arc'], mouth: 'tongue', blush: 1 },
  wink: { mood: 'playful', eyes: ['round', 'arc'], mouth: 'smile' },
  giggle: { mood: 'playful', eyes: ['arc', 'arc'], mouth: 'cat', blush: 1 },
}
const NAMES = Object.keys(EXPRESSIONS) as Expression[]
const W = 2.6
const WHITE = '#fff'

const stroke = (d: string, ink: string, width = W) =>
  el('path', {
    d,
    fill: 'none',
    stroke: ink,
    'stroke-width': width,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  })

// Signature: one large and one small highlight, both toward the top-left.
const catchLights = (cx: number, cy: number, r: number) =>
  el('circle', { cx: cx - r * 0.32, cy: cy - r * 0.32, r: r * 0.34, fill: WHITE }) +
  el('circle', { cx: cx + r * 0.18, cy: cy - r * 0.55, r: r * 0.15, fill: WHITE })

function eye(kind: Eye, x: number, [lx, ly]: [number, number], ink: string): string {
  if (kind === 'round')
    return (
      el('circle', { cx: x, cy: 0, r: 7.2, fill: WHITE }) +
      el('circle', { cx: x + lx, cy: ly, r: 4.4, fill: ink }) +
      catchLights(x + lx, ly, 4.4)
    )
  if (kind === 'dot')
    return (
      el('circle', { cx: x + lx / 2, cy: ly / 2, r: 5.4, fill: ink }) +
      catchLights(x + lx / 2, ly / 2, 5.4)
    )
  if (kind === 'arc') return stroke(`M${num(x - 5)} 2.2Q${num(x)} -5.2 ${num(x + 5)} 2.2`, ink)
  return stroke(`M${num(x - 5)} -0.5Q${num(x)} 4.5 ${num(x + 5)} -0.5`, ink)
}

function mouth(kind: Mouth, ink: string, tongue: string): string {
  switch (kind) {
    case 'smile':
      return stroke('M-5 12Q0 17.5 5 12', ink)
    case 'small':
      return stroke('M-3 12.5Q0 15.5 3 12.5', ink)
    case 'flat':
      return stroke('M-2 13.5L4.5 12.8', ink)
    case 'cat':
      return stroke('M-5.5 11.5Q-2.8 15.5 0 12.3Q2.8 15.5 5.5 11.5', ink)
    case 'o':
      return el('ellipse', { cx: 0, cy: 13.5, rx: 2.6, ry: 3.1, fill: ink })
    case 'grin':
      return (
        el('path', { d: 'M-6.5 10.5Q0 11.5 6.5 10.5Q5.5 19 0 19Q-5.5 19 -6.5 10.5Z', fill: ink }) +
        el('ellipse', { cx: 0, cy: 16.6, rx: 3.2, ry: 1.8, fill: tongue })
      )
    case 'tongue':
      return (
        stroke('M-5 12Q0 16.5 5 12', ink) +
        el('path', { d: 'M0.2 14.6Q1 19.5 3.6 18.6Q5.4 17.6 4.3 13.4Z', fill: tongue })
      )
  }
}

export function face(
  rng: Rng,
  at: { x: number; y: number; r: number; hue: number },
  opts: { mood?: Mood; expression?: Expression },
  /** Extra art in the face's own frame (eyes at ±spread on y = 0), e.g. glasses. Drawn last. */
  wear?: (spread: number, ink: string) => string,
): { svg: string; expression: Expression } {
  const g = rng.fork('face')
  const moodPool = NAMES.filter((n) => EXPRESSIONS[n].mood === opts.mood)
  const pool = moodPool.length ? moodPool : NAMES
  // Always draw, so a forced expression keeps the spread and tilt of the free one.
  const picked = g.pick(pool)
  const expression = known(EXPRESSIONS, opts.expression) ?? picked
  const spread = 11 + g.float(-1, 1.2)
  const tilt = g.float(-7, 7)
  const E = EXPRESSIONS[expression]
  const ink = oklchToHex({ l: 0.24, c: 0.035, h: at.hue })
  const look = E.look ?? [0, 0]
  let out = ''
  if (E.blush) {
    const blush = oklchToHex({ l: 0.72, c: 0.15, h: 8 })
    for (const k of [-1, 1])
      out += el('ellipse', {
        cx: k * (spread + 4.5),
        cy: 6.5,
        rx: 4.4,
        ry: 2.5,
        fill: blush,
        opacity: 0.5 * E.blush,
      })
  }
  out += eye(E.eyes[0], -spread, look, ink) + eye(E.eyes[1], spread, look, ink)
  for (const k of E.brow ? [-1, 1] : []) {
    const x = k * spread
    out += stroke(
      E.brow === 'raise'
        ? `M${num(x - 3.5)} -11Q${num(x)} -13.5 ${num(x + 3.5)} -11`
        : `M${num(x - 3.5)} -10.5L${num(x + 3.5)} -10.5`,
      ink,
      2,
    )
  }
  out += mouth(E.mouth, ink, oklchToHex({ l: 0.68, c: 0.16, h: 15 }))
  if (wear) out += wear(spread, ink)
  const scale = Math.max(0.5, Math.min(1.2, at.r / 22))
  return {
    svg: el(
      'g',
      {
        transform: `translate(${num(at.x)} ${num(at.y - at.r * 0.08)}) rotate(${num(tilt)}) scale(${num(scale)})`,
      },
      out,
    ),
    expression,
  }
}
