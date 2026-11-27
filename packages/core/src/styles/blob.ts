import type { RenderContext, Rendered, Style } from '../create.ts'
import { face, type Expression, type Mood } from '../parts/face.ts'
import { inscribed } from '../parts/inscribed.ts'
import { pickBase, type PaletteName } from '../parts/palette.ts'
import { genome, type Family, type Point } from '../parts/shape.ts'
import { known } from '../parts/known.ts'
import { PALETTES } from '../parts/palette.ts'
import {
  bbox,
  drawBubbles,
  finishDefs,
  finishOver,
  FINISHES,
  gummyDefs,
  gummyOver,
  gummyShadow,
  type Finish,
} from '../parts/finish.ts'
import { backdrop, SHAPES, type Shape } from '../parts/tile.ts'
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
  /** Draws the tint backdrop in this outline. Unset: no tile unless `backdrop: 'tint'` (a circle). */
  shape?: Shape
}
type Base = { h: number; l: number; c: number }
type Fill = (
  ctx: RenderContext,
  d: string,
  base: Base,
  color: (hex: string) => string,
  finish: Finish,
) => { defs: string; body: string }

/** A style's own outline in place of the genome, or undefined to keep the genome (and its picks). */
type Outline<O> = (
  ctx: RenderContext,
  opts: O,
) => { poly: Point[]; d: string; picks: Record<string, unknown> } | undefined

/** Shared by Morph and Gradient: backdrop, genome body, fill, then the face. */
export function blobStyle<O extends BlobOptions = BlobOptions>(
  name: string,
  fill: Fill,
  outline?: Outline<O>,
): Style<O> {
  return {
    name,
    defaults: { finish: 'flat', palette: 'vivid', face: true, backdrop: 'none' } as Partial<O>,
    render(ctx, opts): Rendered {
      const finish = known(FINISHES, opts.finish) ?? 'flat'
      const palette = known(PALETTES, opts.palette) ?? 'vivid'
      const base = pickBase(ctx.rng, palette)
      const genes = genome(ctx.rng, opts.family)
      const own = outline?.(ctx, opts)
      const shape = own ?? genes
      const color = colorVars()
      const painted = fill(ctx, shape.d, base, color, finish)
      const box = bbox(shape.poly)
      const [x, y, r] = inscribed(shape.poly)
      let body = painted.body + finishOver(finish, ctx.id, shape.d, box)
      let gummy = ''
      if (finish === 'gummy') {
        // Gummy draws from its own fork, so it never shifts the style's other draws.
        const bubbles = drawBubbles(ctx.rng.fork('gummy'), shape.poly.length)
        const center = [box.x + box.w / 2, box.y + box.h / 2] as const
        gummy = gummyDefs(
          ctx.id,
          color(lch(Math.min(base.l + 0.14, 0.97), base.c * 0.7, base.h)),
          base,
        )
        body =
          gummyShadow(ctx.id, box) +
          body +
          gummyOver(
            ctx.id,
            shape.d,
            box,
            shape.poly,
            center,
            bubbles,
            opts.face !== false ? [x, y, r] : undefined,
          )
      }
      const tile = known(SHAPES, opts.shape)
      if (opts.backdrop === 'tint' || tile)
        body = backdrop(tile, `var(--avatar-bg, ${lch(0.95, 0.03, base.h)})`) + body
      const picks: Record<string, unknown> = {
        palette,
        hue: Math.round(base.h),
        ...(own ? own.picks : { family: genes.family, lobes: genes.lobes }),
      }
      if (finish !== 'flat') picks.finish = finish
      if (tile) picks.shape = tile
      if (opts.face !== false) {
        const f = face(ctx.rng, { x, y, r, hue: base.h }, opts)
        body += f.svg
        picks.expression = f.expression
      }
      return { defs: painted.defs + finishDefs(finish, ctx.id, base.h) + gummy, body, picks }
    },
  }
}
