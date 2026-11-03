import type { RenderContext, Rendered, Style } from '../create.ts'
import { face, type Expression, type Mood } from '../parts/face.ts'
import { inscribed } from '../parts/inscribed.ts'
import { pickBase, type PaletteName } from '../parts/palette.ts'
import { genome, type Family } from '../parts/shape.ts'
import { known } from '../parts/known.ts'
import { PALETTES } from '../parts/palette.ts'
import { el } from '../svg.ts'
import { colorVars, lch } from './paint.ts'

export type BlobOptions = {
  palette?: PaletteName
  family?: Family
  face?: boolean
  mood?: Mood
  expression?: Expression
  backdrop?: 'none' | 'tint'
}
type Base = { h: number; l: number; c: number }
type Fill = (
  ctx: RenderContext,
  d: string,
  base: Base,
  color: (hex: string) => string,
) => { defs: string; body: string }

/** Shared by Morph and Gradient: backdrop, genome body, fill, then the face. */
export function blobStyle(name: string, fill: Fill): Style<BlobOptions> {
  return {
    name,
    render(ctx, opts): Rendered {
      const palette = known(PALETTES, opts.palette) ?? 'vivid'
      const base = pickBase(ctx.rng, palette)
      const shape = genome(ctx.rng, opts.family)
      const painted = fill(ctx, shape.d, base, colorVars())
      let body = painted.body
      if (opts.backdrop === 'tint')
        body =
          el('circle', {
            cx: 50,
            cy: 50,
            r: 50,
            fill: `var(--avatar-bg, ${lch(0.95, 0.03, base.h)})`,
          }) + body
      const picks: Record<string, unknown> = {
        palette,
        hue: Math.round(base.h),
        family: shape.family,
        lobes: shape.lobes,
      }
      if (opts.face !== false) {
        const [x, y, r] = inscribed(shape.poly)
        const f = face(ctx.rng, { x, y, r, hue: base.h }, opts)
        body += f.svg
        picks.expression = f.expression
      }
      return { defs: painted.defs, body, picks }
    },
  }
}
