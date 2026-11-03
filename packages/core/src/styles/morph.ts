import { el } from '../svg.ts'
import { blobStyle, type BlobOptions } from './blob.ts'
import { lch } from './paint.ts'

export type MorphOptions = BlobOptions

/** Flat seeded blob with a face. */
export const morph = blobStyle('morph', (_ctx, d, b, color) => ({
  defs: '',
  body: el('path', { d, fill: color(lch(b.l, b.c, b.h)) }),
}))
