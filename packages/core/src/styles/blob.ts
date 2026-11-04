import type { RenderContext, Rendered, Style } from '../create.ts'
import { face, type Expression, type Mood } from '../parts/face.ts'
import { inscribed } from '../parts/inscribed.ts'
import { pickBase, type PaletteName } from '../parts/palette.ts'
import { genome, type Family } from '../parts/shape.ts'
import { known } from '../parts/known.ts'
import { PALETTES } from '../parts/palette.ts'
import { bbox, finishDefs, finishOver, FINISHES, type Finish } from '../parts/finish.ts'
import { el } from '../svg.ts'
import { colorVars, lch } from './paint.ts'

export type BlobOptions = {
  palette?: PaletteName
  family?: Family
  face?: boolean
  mood?: Mood
  expression?: Expression
  backdrop?: 'none' | 'tint'
  /** Light and shade over the body. Default `flat`. */
  finish?: Finish
}
type Base = { h: number; l: number; c: number }
type Fill = (
  ctx: RenderContext,
  d: string,
  base: Base,
  color: (hex: string) => string,
  finish: Finish,
) => { defs: string; body: string }

/** Shared by Morph and Gradient: backdrop, genome body, fill, then the face. */
export function blobStyle(name: string, fill: Fill): Style<BlobOptions> {
  return {
    name,
    defaults: { finish: 'flat', palette: 'vivid', face: true, backdrop: 'none' },
    render(ctx, opts): Rendered {
      const finish = known(FINISHES, opts.finish) ?? 'flat'
      const palette = known(PALETTES, opts.palette) ?? 'vivid'
      const base = pickBase(ctx.rng, palette)
      const shape = genome(ctx.rng, opts.family)
      const painted = fill(ctx, shape.d, base, colorVars(), finish)
      let body = painted.body + finishOver(finish, ctx.id, shape.d, bbox(shape.poly))
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
      if (finish !== 'flat') picks.finish = finish
      if (opts.face !== false) {
        const [x, y, r] = inscribed(shape.poly)
        const f = face(ctx.rng, { x, y, r, hue: base.h }, opts)
        body += f.svg
        picks.expression = f.expression
      }
      return { defs: painted.defs + finishDefs(finish, ctx.id, base.h), body, picks }
    },
  }
}
