import { el } from '../svg.ts'
import { blobStyle, type BlobOptions } from './blob.ts'
import { formOutline, GRADIENT_FORMS, type GradientForm } from './gradient-forms.ts'
import { known } from '../parts/known.ts'
import { lch, sheen, spot } from './paint.ts'

export type { GradientForm } from './gradient-forms.ts'
export type GradientOptions = BlobOptions & {
  /** Gradient's own smooth outline (1.3). Unset: the 1.2 genome outline, unchanged. */
  form?: GradientForm
}

/** Seeded blob with a soft mesh fill, the opaline sheen and a face. */
export const gradient = blobStyle<GradientOptions>(
  'gradient',
  ({ rng, id }, d, b, color, finish) => {
    // The finish light replaces the sheen; flat keeps 0.2 exactly.
    const sheens = finish === 'flat' ? ['s'] : []
    const g = rng.fork('mesh')
    const h2 = b.h + (g.next() < 0.5 ? 1 : -1) * g.float(50, 110)
    const h3 = b.h - g.float(30, 70)
    const base = color(lch(b.l, b.c, b.h))
    const c2 = lch(b.l + 0.04, b.c * 1.1, h2)
    const s1 = spot(
      id('m1'),
      color(c2),
      c2,
      g.float(0.15, 0.45),
      g.float(0.1, 0.4),
      g.float(0.6, 0.8),
    )
    const c3 = lch(b.l - 0.04, b.c, h3)
    const s2 = spot(
      id('m2'),
      color(c3),
      c3,
      g.float(0.55, 0.9),
      g.float(0.6, 0.95),
      g.float(0.55, 0.75),
    )
    return {
      defs: s1 + s2 + (sheens.length ? sheen(id('s')) : ''),
      body:
        el('path', { d, fill: base }) +
        ['m1', 'm2', ...sheens].map((n) => el('path', { d, fill: `url(#${id(n)})` })).join(''),
    }
  },
  (ctx, opts) => {
    if (!known(GRADIENT_FORMS, opts.form)) return undefined
    const o = formOutline(ctx.rng, opts.form)
    return { poly: o.poly, d: o.d, picks: { form: o.form } }
  },
)
