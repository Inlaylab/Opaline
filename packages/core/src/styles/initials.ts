import type { Style } from '../create.ts'
import { known } from '../parts/known.ts'
import { PALETTES, pickBase, type PaletteName } from '../parts/palette.ts'
import { rim, SHAPES, tile, type Shape } from '../parts/tile.ts'
import { el, escapeXml } from '../svg.ts'
import { colorVars, lch, sheen } from './paint.ts'

export type InitialsOptions = {
  palette?: PaletteName
  shape?: Shape
  /** Letters to show instead of the ones taken from the seed. Up to 3 characters, used as given. */
  text?: string
}

const WORDS = /[\s._+-]+/
const STARTS_WITH_LETTER = /^[\p{L}\p{N}]/u
const FONT = 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif'

/**
 * The letters an initials avatar shows. `text` wins when it has any; otherwise the first letter
 * of the first and last word of the seed (the part before `@` for an email). Code points, not
 * graphemes: grapheme rules follow each engine's Unicode tables, so they could differ by browser.
 */
export function letters(seed: string, text?: string): string {
  const own = typeof text === 'string' ? text.trim() : ''
  if (own) return Array.from(own).slice(0, 3).join('')
  const at = seed.lastIndexOf('@')
  const words = (at > 0 ? seed.slice(0, at) : seed)
    .split(WORDS)
    .filter((w) => STARTS_WITH_LETTER.test(w))
  if (!words.length) return ''
  const first = Array.from(words[0]!)[0]!
  const last = words.length > 1 ? Array.from(words[words.length - 1]!)[0]! : ''
  return (first + last).toUpperCase()
}

/** Initials on a seeded tile with the opaline sheen. */
export const initials: Style<InitialsOptions> = {
  name: 'initials',
  defaults: { palette: 'vivid', shape: 'circle' },
  render({ rng, id, seed }, opts) {
    const palette = known(PALETTES, opts.palette) ?? 'vivid'
    const shape = known(SHAPES, opts.shape) ?? 'circle'
    const b = pickBase(rng, palette)
    const text = letters(seed, opts.text)
    const d = tile(shape)
    // Light tiles (pastel) take a deep shade of their own hue; the rest take white.
    const fg = b.l < 0.8 ? '#fff' : lch(0.32, 0.06, b.h)
    const body =
      el('path', { d, fill: colorVars()(lch(b.l, b.c, b.h)) }) +
      el('path', { d, fill: `url(#${id('s')})` }) +
      rim(shape) +
      (text
        ? el(
            'text',
            {
              x: 50,
              y: 50,
              dy: '0.35em',
              'text-anchor': 'middle',
              'font-family': FONT,
              'font-size': Array.from(text).length > 2 ? 30 : 40,
              'font-weight': 600,
              fill: `var(--avatar-fg, ${fg})`,
            },
            escapeXml(text),
          )
        : '')
    return { defs: sheen(id('s')), body, picks: { palette, hue: Math.round(b.h), shape, text } }
  },
}
