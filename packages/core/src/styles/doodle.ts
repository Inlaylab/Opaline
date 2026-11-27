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

export type DoodleOptions = {
  palette?: PaletteName
  /** The colour look. Default `natural`. */
  scheme?: Scheme
  mood?: PersonaMood
  expression?: PersonaExpression
  /** The tile. Default `square`; `none` draws the face alone, transparent. */
  shape?: PersonaShape
}

const NOSES = ['hook', 'button', 'line', 'dot'] as const
// `none` twice: about one doodle in three has no extra.
const EXTRAS = ['none', 'glasses', 'square', 'freckles', 'none', 'cheeks'] as const

/** Face-only line drawings with big, expressive features. */
export const doodle: Style<DoodleOptions> = {
  name: 'doodle',
  defaults: { palette: 'vivid', scheme: 'natural', shape: 'square' },
  render(ctx, opts): Rendered {
    const { rng, id } = ctx
    const palette = known(PALETTES, opts.palette) ?? 'vivid'
    const scheme = known(SCHEMES, opts.scheme) ?? 'natural'
    const b = pickBase(rng, palette)
    // Every draw is always taken, in this order, so a set option never shifts the others.
    const g = rng.fork('doodle')
    const nose = g.pick(NOSES)
    const extra = g.pick(EXTRAS)
    const tilt = g.float(-7, 7)
    const heavy = g.float(2.6, 3.4)
    const expression = pickPersona(g.fork('expr'), opts)
    const c0 = schemeColors(g.fork('colour'), scheme, b.h)
    // Doodle has no skin: catch-lights take the wall colour, and natural ink is a deep shade of the hue.
    const c =
      scheme === 'natural'
        ? { ...c0, ink: lch(0.28, 0.06, b.h), skin: c0.bg!, w: undefined, bw: undefined }
        : {
            ...c0,
            skin: c0.bg && c0.bg !== 'sunrise' ? c0.bg : c0.bg === 'sunrise' ? '#ffc2b8' : '#fff',
          }
    // Electric: the saturated hair colour becomes the ink, since a doodle has no hair to carry it.
    if (scheme === 'electric') c.ink = c.hair
    const defs: string[] = []

    const wallSvg = wall(c.bg, defs, id)

    const { ink } = c
    const s = 10
    const n = num
    const f = personaFace(expression, s, c, { blush: c.blush, browW: heavy })
    let face = f.cheeks + f.eyes
    face +=
      nose === 'hook'
        ? stroke('M0.6 1.4Q-2.4 6 1.2 6.4', ink, 1.6)
        : nose === 'button'
          ? stroke('M-1.8 5.6Q0 7 1.8 5.6', ink, 1.6)
          : nose === 'line'
            ? stroke('M0.4 1L-1.2 6L1.2 6', ink, 1.6)
            : `<circle cx="0" cy="5.4" r="1" fill="${ink}"/>`
    face += f.mouth
    if (extra === 'glasses' && !f.shades)
      face +=
        `<circle cx="${-s}" cy="0" r="6.4" fill="none" stroke="${ink}" stroke-width="1.6"/><circle cx="${s}" cy="0" r="6.4" fill="none" stroke="${ink}" stroke-width="1.6"/>` +
        stroke(`M${-s + 6.4} -0.4Q0 -2.2 ${s - 6.4} -0.4`, ink, 1.6) +
        stroke(`M${-s - 6.4} -1L${-s - 10} -2.6M${s + 6.4} -1L${s + 10} -2.6`, ink, 1.6)
    if (extra === 'square' && !f.shades)
      face +=
        `<rect x="${-s - 6.4}" y="-4.6" width="12.8" height="9.2" rx="2.4" fill="none" stroke="${ink}" stroke-width="1.8"/><rect x="${s - 6.4}" y="-4.6" width="12.8" height="9.2" rx="2.4" fill="none" stroke="${ink}" stroke-width="1.8"/>` +
        stroke(`M${-s + 6.4} -1.4L${s - 6.4} -1.4`, ink, 1.8)
    if (extra === 'freckles')
      for (const k of [-1, 1])
        for (const [dx, dy] of [
          [0, 0],
          [2.2, 1.2],
          [-1.6, 1.8],
          [1, 2.8],
        ] as const)
          face += `<circle cx="${n(k * (s + 1) + dx)}" cy="${n(6 + dy)}" r=".7" fill="${ink}"/>`
    if (extra === 'cheeks')
      face += stroke(`M${-s - 5} 7L${-s - 2} 9M${s + 5} 7L${s + 2} 9`, ink, 1.2)
    const out = `<g transform="translate(50 46) rotate(${n(tilt)}) scale(2.05)">${face}</g>`

    const shape =
      opts.shape === 'none'
        ? 'none'
        : (known({ circle: 1, squircle: 1, square: 1 }, opts.shape) ?? 'square')
    const body = tiled(wallSvg, out, defs, id, shape, lch(0.95, 0.03, b.h))
    const picks: Record<string, unknown> = {
      palette,
      hue: Math.round(b.h),
      nose,
      extra,
      expression,
    }
    if (scheme !== 'natural') picks.scheme = scheme
    if (shape !== 'square') picks.shape = shape
    return { defs: defs.join(''), body, picks }
  },
}
