import { el } from '../svg.ts'
import { blobStyle, type BlobOptions } from './blob.ts'
import { lch, sheen, spot } from './paint.ts'

export type GradientOptions = BlobOptions

/** Seeded blob with a soft mesh fill, the opaline sheen and a face. */
export const gradient = blobStyle('gradient', ({ rng, id }, d, b, color) => {
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
    defs: s1 + s2 + sheen(id('s')),
    body:
      el('path', { d, fill: base }) +
      ['m1', 'm2', 's'].map((n) => el('path', { d, fill: `url(#${id(n)})` })).join(''),
  }
})
