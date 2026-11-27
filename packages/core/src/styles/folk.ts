import type { Rendered, Style } from '../create.ts'
import { known } from '../parts/known.ts'
import { PALETTES, pickBase, type PaletteName } from '../parts/palette.ts'
import {
  lineStroke as stroke,
  personaFace,
  pickPersona,
  SCHEMES,
  schemeColors,
  tiled,
  wall,
  type PersonaExpression,
  type PersonaMood,
  type PersonaShape,
  type Scheme,
} from '../parts/persona.ts'
import { num } from '../svg.ts'
import { lch } from './paint.ts'

export type FolkOptions = {
  /** Sets the clothes and the soft tint; a seed keeps its hue across styles. */
  palette?: PaletteName
  /** The colour look. Default `duotone`, in the seed's palette hue. */
  scheme?: Scheme
  mood?: PersonaMood
  expression?: PersonaExpression
  /** The tile. Default `square`; `none` draws the person alone, transparent. */
  shape?: PersonaShape
}

type Hair =
  | 'short'
  | 'curly'
  | 'bob'
  | 'long'
  | 'bun'
  | 'spiky'
  | 'puffs'
  | 'buzz'
  | 'bald'
  | 'scarf'
  | 'afro'
  | 'ponytail'
  | 'braids'
  | 'quiff'
const HAIR: Hair[] = [
  'short',
  'curly',
  'bob',
  'long',
  'bun',
  'spiky',
  'puffs',
  'buzz',
  'bald',
  'scarf',
  'afro',
  'ponytail',
  'braids',
  'quiff',
]
/** Beards and moustaches only ever go with these short styles, never with earrings or a headscarf. */
export const BEARDABLE: readonly Hair[] = [
  'short',
  'curly',
  'spiky',
  'buzz',
  'bald',
  'quiff',
  'afro',
]
const OUTFITS = ['crew', 'collar', 'hoodie', 'stripes', 'overalls'] as const
const SHIRT = 'M12 101C12 84 26 76 40 75L60 75C74 76 88 84 88 101Z'
const HEAD = 'M50 22C66 22 74 34 74 48C74 62 64 72 50 72C36 72 26 62 26 48C26 34 34 22 50 22Z'
const FRONT: Partial<Record<Hair, string>> = {
  short: 'M25 47C22 27 35 17 51 18C67 19 78 29 75 47C71 37 62 31 51 31C41 31 31 36 25 47Z',
  bob: 'M26 44C26 28 37 19 50 19C63 19 74 28 74 44C66 42 58 36 55 29C49 37 38 42 26 44Z',
  long: 'M26 46C25 28 36 18 50 18C64 18 75 28 74 46C68 38 58 30 50 25C42 30 32 38 26 46Z',
  bun: 'M25 45C24 27 36 19 50 19C64 19 76 27 75 45C68 34 60 30 50 30C40 30 32 34 25 45Z',
  spiky:
    'M26 44L27 26L35 31L39 17L47 27L53 13L59 27L67 19L69 31L76 29L74 45C68 36 58 32 50 32C40 32 32 36 26 44Z',
  puffs: 'M25 45C24 27 36 19 50 19C64 19 76 27 75 45C68 36 58 31 50 31C42 31 32 36 25 45Z',
  buzz: 'M26.5 44C27 29 37 21.5 50 21.5C63 21.5 73 29 73.5 44C67 35 59 31.5 50 31.5C41 31.5 33 35 26.5 44Z',
  scarf: 'M26 42C29 26 39 19 50 19C61 19 71 26 74 42C67 33 59 29 50 29C41 29 33 33 26 42Z',
  afro: 'M27 44C27 30 38 22 50 22C62 22 73 30 73 44C66 37 58 34 50 34C42 34 34 37 27 44Z',
  ponytail: 'M25 45C24 27 36 19 50 19C64 19 76 27 75 45C68 34 60 30 50 30C40 30 32 34 25 45Z',
  braids: 'M26 46C25 28 36 18 50 18C64 18 75 28 74 46C68 38 58 30 50 25C42 30 32 38 26 46Z',
  quiff: 'M25 46C22 28 32 14 50 13C62 12 74 18 76 30C70 26 64 27 58 30C48 30 34 36 25 46Z',
}

/** Human-like people, head and shoulders, in bold line with a personality face. */
export const folk: Style<FolkOptions> = {
  name: 'folk',
  defaults: { palette: 'vivid', scheme: 'duotone', shape: 'square' },
  render(ctx, opts): Rendered {
    const { rng, id } = ctx
    const palette = known(PALETTES, opts.palette) ?? 'vivid'
    const scheme = known(SCHEMES, opts.scheme) ?? 'duotone'
    const hue = pickBase(rng, palette).h
    // Every draw is always taken, in this order, so a set option never shifts the others.
    const g = rng.fork('folk')
    const hair = g.pick(HAIR)
    const outfit = g.pick(OUTFITS)
    const facialRoll = g.next()
    const glassesRoll = g.next()
    const extraRoll = g.next()
    const expression = pickPersona(g.fork('expr'), opts, hair === 'scarf' ? ['cheeky'] : [])
    const c = schemeColors(g.fork('colour'), scheme, hue)
    const { ink } = c
    const n = num
    const sw = 2.2
    const F = (d: string, fill: string) =>
      `<path d="${d}" fill="${fill}" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round"/>`
    const C = (cx: number, cy: number, r: number, fill: string) =>
      `<circle cx="${n(cx)}" cy="${n(cy)}" r="${r}" fill="${fill}" stroke="${ink}" stroke-width="${sw}"/>`
    const defs: string[] = []

    // Shirt, hair behind the head, neck and neckline.
    let out = F(SHIRT, c.cloth)
    if (outfit === 'stripes') {
      defs.push(`<clipPath id="${id('sh')}"><path d="${SHIRT}"/></clipPath>`)
      out +=
        `<g clip-path="url(#${id('sh')})">${[84, 90, 96].map((y) => `<path d="M0 ${y}H100" stroke="${c.flat ? ink : c.cloth2}" stroke-width="2.6"/>`).join('')}</g>` +
        `<path d="${SHIRT}" fill="none" stroke="${ink}" stroke-width="${sw}"/>`
    }
    if (outfit === 'overalls')
      out +=
        F('M38 88H62V101H38Z', c.cloth2) +
        stroke('M37 77L39 90M63 77L61 90', ink) +
        `<circle cx="41" cy="91.5" r="1.3" fill="${ink}"/><circle cx="59" cy="91.5" r="1.3" fill="${ink}"/>`
    if (hair === 'scarf')
      out += F(
        'M50 14C71 14 83 31 83 52C83 70 77 84 67 94L33 94C23 84 17 70 17 52C17 31 29 14 50 14Z',
        c.cloth2,
      )
    if (hair === 'long')
      out += F(
        'M21 88C12 56 20 15 50 15C80 15 88 56 79 88C74 90 70 84 70 74L30 74C30 84 26 90 21 88Z',
        c.hair,
      )
    if (hair === 'bob')
      out += F(
        'M21 66C15 36 29 15 50 15C71 15 85 36 79 66C74 68 72 62 72 56L28 56C28 62 26 68 21 66Z',
        c.hair,
      )
    if (hair === 'puffs') out += C(27, 28, 10, c.hair) + C(73, 28, 10, c.hair)
    if (hair === 'bun') out += C(50, 15, 8, c.hair)
    if (hair === 'afro') out += C(50, 40, 28, c.hair)
    if (hair === 'ponytail') out += F('M66 26Q88 32 83 60Q81 70 74 72Q79 56 69 40Z', c.hair)
    if (hair === 'braids')
      for (const k of [-1, 1])
        for (let i = 0; i < 5; i++)
          out += `<ellipse cx="${n(50 + k * (23 - i * 0.4))}" cy="${n(54 + i * 7.4)}" rx="4.6" ry="4.4" fill="${c.hair}" stroke="${ink}" stroke-width="${sw}"/>`
    out += F('M43 60L43 74Q50 80 57 74L57 60Z', c.skin)
    if (outfit === 'collar')
      out += F(
        'M41.5 75.4L46 84L50 78L54 84L58.5 75.4Q50 80.5 41.5 75.4Z',
        c.flat ? c.cloth : '#fff',
      )
    if (outfit === 'hoodie')
      out += stroke('M33 78Q50 92 67 78', ink) + stroke('M45 81L44 91M55 81L56 91', ink, 1.6)
    if (outfit === 'crew') out += stroke('M41 76Q50 82 59 76', ink, 1.6)

    // Head, then hair in front.
    if (hair !== 'scarf') out += C(26.5, 50, 4.6, c.skin) + C(73.5, 50, 4.6, c.skin)
    out += F(HEAD, c.skin)
    if (hair === 'curly') {
      for (let a = -170; a <= -10; a += 20) {
        const r = (a * Math.PI) / 180
        out += C(50 + 24 * Math.cos(r), 43 + 23 * Math.sin(r), 7.6, c.hair)
      }
      out += `<path d="M28 46C28 30 38 23 50 23C62 23 72 30 72 46C66 38 58 34 50 34C42 34 34 38 28 46Z" fill="${c.hair}"/>`
    } else if (FRONT[hair]) out += F(FRONT[hair]!, hair === 'scarf' ? c.cloth2 : c.hair)

    // Earrings and facial hair. Facial hair sits under the mouth line, so the mouth always shows.
    const beardable = BEARDABLE.includes(hair)
    const earrings = !beardable && hair !== 'scarf' && extraRoll < 0.35
    const freckles = extraRoll > 0.82
    const facial = beardable
      ? facialRoll < 0.16
        ? 'beard'
        : facialRoll < 0.26
          ? 'moustache'
          : 'none'
      : 'none'
    if (earrings)
      out += `<circle cx="26" cy="56.5" r="1.8" fill="#f2c14e" stroke="${ink}" stroke-width="1"/><circle cx="74" cy="56.5" r="1.8" fill="#f2c14e" stroke="${ink}" stroke-width="1"/>`
    if (facial === 'beard')
      out += F(
        'M27 52C28 66 38 73 50 73C62 73 72 66 73 52C70 62 64 66 50 66C36 66 30 62 27 52Z',
        c.hair,
      )
    if (facial === 'moustache')
      out += `<path d="M41.5 56Q45.5 52.4 50 54.4Q54.5 52.4 58.5 56Q54.5 57 50 55.8Q45.5 57 41.5 56Z" fill="${c.hair}" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>`

    // Face.
    const s = 8.6
    const f = personaFace(expression, s, c, { blush: c.blush, browW: c.bw ?? 2.2 })
    let face = f.cheeks + f.eyes + stroke('M0.6 1.6Q-1.8 5.6 1 6.2', ink, 1.6)
    if (freckles)
      for (const k of [-1, 1])
        for (const [dx, dy] of [
          [0, 0],
          [2, 1.1],
          [-1.4, 1.6],
        ] as const)
          face += `<circle cx="${n(k * (s + 1.4) + dx)}" cy="${n(5.6 + dy)}" r=".6" fill="${ink}"/>`
    face += facial === 'moustache' ? `<g transform="translate(0 1.4)">${f.mouth}</g>` : f.mouth
    const glasses = glassesRoll < 0.28 && !f.shades
    if (glasses)
      face +=
        `<circle cx="${-s}" cy="0" r="6" fill="none" stroke="${ink}" stroke-width="1.6"/><circle cx="${s}" cy="0" r="6" fill="none" stroke="${ink}" stroke-width="1.6"/>` +
        stroke(`M${n(-s + 6)} -0.6Q0 -2.4 ${n(s - 6)} -0.6`, ink, 1.6)
    out += `<g transform="translate(50 47)">${face}</g>`

    const shape =
      opts.shape === 'none'
        ? 'none'
        : (known({ circle: 1, squircle: 1, square: 1 }, opts.shape) ?? 'square')
    const body = tiled(
      wall(c.bg, defs, id),
      out,
      defs,
      id,
      shape,
      c.bg === null ? null : lch(0.95, 0.03, hue),
    )
    const picks: Record<string, unknown> = {
      palette,
      hue: Math.round(hue),
      hair,
      outfit,
      facial,
      earrings,
      glasses,
      expression,
    }
    if (scheme !== 'duotone') picks.scheme = scheme
    if (shape !== 'square') picks.shape = shape
    return { defs: defs.join(''), body, picks }
  },
}
