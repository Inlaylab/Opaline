import type { Rng } from '../prng.ts'

export type PaletteName = 'vivid' | 'pastel' | 'electric' | 'muted' | 'warm' | 'cool' | 'mono'
export type Palette = { l: number; c: number; hues: readonly number[] }

const ANCHORS = [18, 42, 70, 145, 172, 205, 238, 268, 300, 335]

/** OKLCH lightness and chroma per palette, so every hue in one palette reads equally light. */
export const PALETTES: Record<PaletteName, Palette> = {
  vivid: { l: 0.74, c: 0.16, hues: ANCHORS },
  pastel: { l: 0.87, c: 0.08, hues: ANCHORS },
  electric: { l: 0.7, c: 0.25, hues: [0, 30, 140, 190, 255, 290, 320] },
  muted: { l: 0.7, c: 0.055, hues: ANCHORS },
  warm: { l: 0.76, c: 0.15, hues: [15, 30, 48, 65, 85] },
  cool: { l: 0.72, c: 0.13, hues: [165, 190, 215, 240, 265, 285] },
  mono: { l: 0.66, c: 0.035, hues: [262] },
}

export function pickBase(rng: Rng, palette: PaletteName): { h: number; l: number; c: number } {
  const p = PALETTES[palette]
  const g = rng.fork('color')
  const h = g.pick(p.hues) + g.float(-9, 9)
  return { h: (h + 360) % 360, l: p.l + g.float(-0.03, 0.03), c: p.c }
}
