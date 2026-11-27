import { oklchToHex } from '../color.ts'
import type { Rng } from '../prng.ts'
import { el, num } from '../svg.ts'
import { known } from './known.ts'

export type Mood = 'happy' | 'calm' | 'surprised' | 'playful'
export type Eye =
  | 'round'
  | 'dot'
  | 'arc'
  | 'lid'
  | 'star'
  | 'heart'
  | 'squintL'
  | 'squintR'
  | 'half'
  | 'sparkle'
  | 'shadesL'
  | 'shadesR'
export type Mouth =
  'smile' | 'small' | 'flat' | 'cat' | 'o' | 'grin' | 'tongue' | 'laugh' | 'side' | 'smirk' | 'yawn'
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
  | 'starry'
  | 'love'
  | 'laugh'
  | 'cool'
  | 'nice'
  | 'smug'
  | 'yawn'
  | 'wow'
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
  // 1.3, opt-in only: reachable by `expression` or a style's own `pool`, never by a free or mood pick
  // of the 1.2 styles, so every 1.2 face stays byte-identical.
  starry: { mood: 'happy', eyes: ['star', 'star'], mouth: 'grin', blush: 1 },
  love: { mood: 'happy', eyes: ['heart', 'heart'], mouth: 'smile' },
  laugh: { mood: 'happy', eyes: ['squintL', 'squintR'], mouth: 'laugh', blush: 1.2 },
  cool: { mood: 'happy', eyes: ['shadesL', 'shadesR'], mouth: 'smirk' },
  nice: { mood: 'happy', eyes: ['star', 'arc'], mouth: 'grin', brow: 'raise', blush: 0.8 },
  smug: { mood: 'playful', eyes: ['half', 'half'], mouth: 'side', look: [1.2, 0] },
  yawn: { mood: 'calm', eyes: ['lid', 'lid'], mouth: 'yawn' },
  wow: { mood: 'surprised', eyes: ['sparkle', 'sparkle'], mouth: 'o', brow: 'raise' },
}
/** The 1.2 set. Free and mood picks draw only from it unless a style passes its own `pool`. */
export const LEGACY_EXPRESSIONS = [
  'beam',
  'content',
  'proud',
  'dreamy',
  'hmm',
  'shy',
  'sleepy',
  'curious',
  'oh',
  'cheeky',
  'wink',
  'giggle',
] as const satisfies readonly Expression[]
/** Happy and playful only: the default pool of Critters and Cosmos. */
export const JOLLY: readonly Expression[] = [
  'beam',
  'content',
  'proud',
  'starry',
  'love',
  'laugh',
  'cool',
  'nice',
  'cheeky',
  'wink',
  'giggle',
]
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
  if (kind === 'lid') return stroke(`M${num(x - 5)} -0.5Q${num(x)} 4.5 ${num(x + 5)} -0.5`, ink)
  // Starry: a big glossy eye whose catch-light is a star (reads at 24px).
  if (kind === 'star')
    return (
      el('circle', { cx: x, cy: 0, r: 6.4, fill: ink }) +
      twinkle(x - 0.6, -0.8, 4.2) +
      el('circle', { cx: x + 2.8, cy: 2.8, r: 0.9, fill: WHITE })
    )
  if (kind === 'heart')
    return (
      el('path', {
        d: `M${num(x)} 6.4C${num(x - 2.4)} 4.6 ${num(x - 8.6)} 0.6 ${num(x - 7.4)} -3.6C${num(x - 6.4)} -7.4 ${num(x - 1.8)} -7.6 ${num(x)} -4C${num(x + 1.8)} -7.6 ${num(x + 6.4)} -7.4 ${num(x + 7.4)} -3.6C${num(x + 8.6)} 0.6 ${num(x + 2.4)} 4.6 ${num(x)} 6.4Z`,
        fill: '#e23a6d',
      }) +
      el('ellipse', {
        cx: x - 3.6,
        cy: -3.4,
        rx: 1.8,
        ry: 1.2,
        transform: `rotate(-30 ${num(x - 3.6)} -3.4)`,
        fill: WHITE,
        opacity: 0.9,
      })
    )
  if (kind === 'squintL')
    return stroke(`M${num(x - 4.5)} -3.5L${num(x + 3)} 0L${num(x - 4.5)} 3.5`, ink)
  if (kind === 'squintR')
    return stroke(`M${num(x + 4.5)} -3.5L${num(x - 3)} 0L${num(x + 4.5)} 3.5`, ink)
  if (kind === 'half') {
    const cx = x + lx * 0.5
    return (
      el('path', { d: `M${num(cx - 5.4)} 0A5.4 5.4 0 0 0 ${num(cx + 5.4)} 0Z`, fill: ink }) +
      stroke(`M${num(cx - 6)} -0.4L${num(cx + 6)} -0.4`, ink) +
      el('circle', { cx: cx - 1.8, cy: 1.6, r: 1.2, fill: WHITE })
    )
  }
  if (kind === 'sparkle')
    return (
      el('circle', { cx: x, cy: 0, r: 7.6, fill: WHITE }) +
      el('circle', { cx: x, cy: 0.4, r: 5.2, fill: ink }) +
      sparkle(x - 1.6, -1.4, 2.6) +
      el('circle', { cx: x + 1.8, cy: 2, r: 0.9, fill: WHITE })
    )
  // Cool: a rounded shades lens with a glint; the left one also draws the bridge.
  return (
    el('path', {
      d: `M${num(x - 7)} -4.2H${num(x + 7)}Q${num(x + 7.4)} 3.6 ${num(x)} 4.6Q${num(x - 7.4)} 3.6 ${num(x - 7)} -4.2Z`,
      fill: ink,
    }) +
    el('path', {
      d: `M${num(x - 4.2)} 1.6L${num(x - 1)} -2.6`,
      stroke: WHITE,
      'stroke-width': 1.4,
      'stroke-linecap': 'round',
      opacity: 0.8,
    }) +
    (kind === 'shadesL'
      ? el('path', {
          d: `M${num(x + 6.6)} -3.4L${num(-x - 6.6)} -3.4`,
          stroke: ink,
          'stroke-width': 2,
          'stroke-linecap': 'round',
        })
      : '')
  )
}

/** A soft four-point twinkle, used as a catch-light. */
const twinkle = (cx: number, cy: number, r: number) =>
  el('path', {
    d: `M${num(cx)} ${num(cy - r)}Q${num(cx + r * 0.18)} ${num(cy - r * 0.18)} ${num(cx + r)} ${num(cy)}Q${num(cx + r * 0.18)} ${num(cy + r * 0.18)} ${num(cx)} ${num(cy + r)}Q${num(cx - r * 0.18)} ${num(cy + r * 0.18)} ${num(cx - r)} ${num(cy)}Q${num(cx - r * 0.18)} ${num(cy - r * 0.18)} ${num(cx)} ${num(cy - r)}Z`,
    fill: WHITE,
  })
const sparkle = (cx: number, cy: number, r: number) =>
  el('path', {
    d: `M${num(cx)} ${num(cy - r)}Q${num(cx)} ${num(cy)} ${num(cx + r)} ${num(cy)}Q${num(cx)} ${num(cy)} ${num(cx)} ${num(cy + r)}Q${num(cx)} ${num(cy)} ${num(cx - r)} ${num(cy)}Q${num(cx)} ${num(cy)} ${num(cx)} ${num(cy - r)}Z`,
    fill: WHITE,
  })

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
    case 'laugh':
      return (
        el('path', { d: 'M-7.5 10Q0 11.5 7.5 10Q6.5 21.5 0 21.5Q-6.5 21.5 -7.5 10Z', fill: ink }) +
        el('ellipse', { cx: 0, cy: 18.4, rx: 4, ry: 2.3, fill: tongue })
      )
    case 'side':
      return stroke('M-4.5 13.4Q0.5 15.6 5.5 11', ink)
    // A lopsided open grin, higher on one side: confident, still friendly.
    case 'smirk':
      return (
        el('path', { d: 'M-5.5 12Q1.5 13.2 7 9.6Q5.8 17.6 0 17.2Q-4.2 16.4 -5.5 12Z', fill: ink }) +
        el('ellipse', { cx: 1.4, cy: 15, rx: 2.6, ry: 1.4, fill: tongue })
      )
    case 'yawn':
      return (
        el('ellipse', { cx: 0, cy: 14.6, rx: 3.6, ry: 5, fill: ink }) +
        el('ellipse', { cx: 0, cy: 17.6, rx: 2.2, ry: 1.4, fill: tongue })
      )
  }
}

export function face(
  rng: Rng,
  at: { x: number; y: number; r: number; hue: number },
  opts: {
    mood?: Mood
    expression?: Expression
    /** The free and mood pool; defaults to the 1.2 set. */
    pool?: readonly Expression[]
    /** Draw blush at 1 when the expression has none (Critters, Cosmos). */
    blush?: boolean
    /** Ink colour; default a deep shade of the hue. Light ink for a face on a dark body. */
    ink?: string
  },
  /** Extra art in the face's own frame (eyes at ±spread on y = 0), e.g. glasses. Drawn last. */
  wear?: (spread: number, ink: string) => string,
): { svg: string; expression: Expression } {
  const g = rng.fork('face')
  // A style with its own pool (new in 1.3) may take any expression of the asked mood; the 1.2 styles
  // keep their 1.2 lists, so their seeds never land on a new face.
  const names = opts.pool ?? LEGACY_EXPRESSIONS
  const moodSrc = opts.pool ? (Object.keys(EXPRESSIONS) as Expression[]) : LEGACY_EXPRESSIONS
  const moodPool = moodSrc.filter((n) => EXPRESSIONS[n].mood === opts.mood)
  const pool = moodPool.length ? moodPool : names
  // Always draw, so a forced expression keeps the spread and tilt of the free one.
  const picked = g.pick(pool)
  const expression = known(EXPRESSIONS, opts.expression) ?? picked
  const spread = 11 + g.float(-1, 1.2)
  const tilt = g.float(-7, 7)
  const E = EXPRESSIONS[expression]
  const ink = opts.ink ?? oklchToHex({ l: 0.24, c: 0.035, h: at.hue })
  const look = E.look ?? [0, 0]
  let out = ''
  const blushAt = E.blush ?? (opts.blush ? 1 : 0)
  if (blushAt) {
    const blush = oklchToHex({ l: 0.72, c: 0.15, h: 8 })
    for (const k of [-1, 1])
      out += el('ellipse', {
        cx: k * (spread + 4.5),
        cy: 6.5,
        rx: 4.4,
        ry: 2.5,
        fill: blush,
        opacity: 0.5 * blushAt,
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
