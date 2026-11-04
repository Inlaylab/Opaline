import type { Style } from '../create.ts'
import { known } from '../parts/known.ts'
import { PALETTES, pickBase, type PaletteName } from '../parts/palette.ts'
import { rim, SHAPES, tile, type Shape } from '../parts/tile.ts'
import { el } from '../svg.ts'
import { colorVars, lch, sheen, spot } from './paint.ts'

export type AuraOptions = { palette?: PaletteName; shape?: Shape }

/** Faceless milky-glass orb: three soft color spots, the sheen and a faint rim. */
export const aura: Style<AuraOptions> = {
  name: 'aura',
  defaults: { palette: 'vivid', shape: 'circle' },
  render({ rng, id }, opts) {
    const palette = known(PALETTES, opts.palette) ?? 'vivid'
    const shape = known(SHAPES, opts.shape) ?? 'circle'
    const b = pickBase(rng, palette)
    const g = rng.fork('aura')
    const color = colorVars()
    const d = tile(shape)
    const side = g.next() < 0.5 ? 1 : -1
    const hues = [
      b.h + side * g.float(45, 95),
      b.h - side * g.float(25, 60),
      b.h + 180 + g.float(-30, 30),
    ]
    const base = color(lch(b.l, b.c, b.h))
    const spots = hues.map((h, i) => {
      const hex = lch(b.l + g.float(-0.06, 0.08), b.c * g.float(0.9, 1.15), h)
      return spot(
        id('b' + i),
        color(hex),
        hex,
        g.float(0.1, 0.9),
        g.float(0.1, 0.9),
        g.float(0.45, 0.75),
      )
    })
    const body =
      el('path', { d, fill: base }) +
      ['b0', 'b1', 'b2', 's'].map((n) => el('path', { d, fill: `url(#${id(n)})` })).join('') +
      rim(shape)
    return {
      defs: spots.join('') + sheen(id('s')),
      body,
      picks: { palette, hue: Math.round(b.h), shape },
    }
  },
}
