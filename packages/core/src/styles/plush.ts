import type { Rendered, Style } from '../create.ts'
import type { Rng } from '../prng.ts'
import {
  ACCESSORIES,
  accessory as wearOver,
  EYEWEAR,
  eyewear,
  type Accessory,
} from '../parts/accessory.ts'
import { face } from '../parts/face.ts'
import { bbox, finishDefs, finishOver } from '../parts/finish.ts'
import { inscribed } from '../parts/inscribed.ts'
import { known } from '../parts/known.ts'
import { PALETTES, pickBase } from '../parts/palette.ts'
import { FAMILIES as ALL_FAMILIES, genome, type Family, type Point } from '../parts/shape.ts'
import { backdrop, SHAPES } from '../parts/tile.ts'
import { el, num } from '../svg.ts'
import type { BlobOptions } from './blob.ts'
import { colorVars, lch } from './paint.ts'

export type PlushOptions = Omit<BlobOptions, 'finish'> & {
  /**
   * Something the critter wears. Unset: drawn from the seed, often `none`. Glasses and shades sit
   * on the face, so with `face: false` they are left off (and the pick reads `none`).
   */
  accessory?: Accessory
}

const FAMILIES: Family[] = ['egg', 'cushion', 'duo', 'tri']
const ANY_FAMILY = Object.fromEntries(ALL_FAMILIES.map((f) => [f, true])) as Record<Family, true>
const ACCESSORY_NAMES = Object.keys(ACCESSORIES) as Accessory[]
// `none` twice: about one critter in six is bare.
const ACCESSORY_DRAW: Accessory[] = ['none', ...ACCESSORY_NAMES]
const SCALE = 0.88
const CY = 53
/** Tufts around the outline. Even, so valleys and peaks alternate all the way round. */
const TUFTS = 96

/** Evenly spaced points along a closed outline. */
function resample(poly: Point[], n: number): Point[] {
  const len: number[] = [0]
  for (let i = 1; i <= poly.length; i++) {
    const [ax, ay] = poly[i - 1]!
    const [bx, by] = poly[i % poly.length]!
    len.push(len[i - 1]! + Math.hypot(bx - ax, by - ay))
  }
  const total = len[poly.length]!
  const out: Point[] = []
  for (let k = 0, i = 0; k < n; k++) {
    const at = (k / n) * total
    while (len[i + 1]! < at) i++
    const f = (at - len[i]!) / (len[i + 1]! - len[i]! || 1)
    const [ax, ay] = poly[i]!
    const [bx, by] = poly[(i + 1) % poly.length]!
    out.push([ax + (bx - ax) * f, ay + (by - ay) * f])
  }
  return out
}

/**
 * A furry outline: valleys on the body edge, each tuft a curve through a seeded peak pushed out
 * along the normal and swept along the edge. Every tuft takes its two draws, always.
 */
function fur(pts: Point[], g: Rng, reach: number, sweep: number): string {
  const n = pts.length
  // Outward normal: the genome runs clockwise on screen, so the right-hand normal points out.
  const normal = (i: number): Point => {
    const [ax, ay] = pts[(i + n - 1) % n]!
    const [bx, by] = pts[(i + 1) % n]!
    const l = Math.hypot(bx - ax, by - ay) || 1
    return [(by - ay) / l, -(bx - ax) / l]
  }
  const at = (i: number, out: number, along: number): Point => {
    const [x, y] = pts[i % n]!
    const [nx, ny] = normal(i % n)
    return [x + nx * out - ny * along, y + ny * out + nx * along]
  }
  const v0 = at(0, -0.5, 0)
  let d = `M${num(v0[0])} ${num(v0[1])}`
  for (let i = 1; i < n; i += 2) {
    const p = at(i, reach * g.float(0.35, 1.5), g.float(-sweep, sweep))
    const v = at(i + 1, -0.5, 0)
    d += `Q${num(p[0])} ${num(p[1])} ${num(v[0])} ${num(v[1])}`
  }
  return d + 'Z'
}

/** Soft felt critters: a fuzzy body, a face, and now and then something to wear. */
export const plush: Style<PlushOptions> = {
  name: 'plush',
  defaults: { palette: 'vivid', face: true, backdrop: 'none' },
  render(ctx, opts): Rendered {
    const { rng, id } = ctx
    const palette = known(PALETTES, opts.palette) ?? 'vivid'
    const b = pickBase(rng, palette)
    // Every draw is always taken, in this order, so a set option never shifts the others.
    const g = rng.fork('plush')
    const drawnFamily = g.pick(FAMILIES)
    const drawnAccessory = g.pick(ACCESSORY_DRAW)
    const dir = g.next() < 0.5 ? -1 : 1
    const shape = genome(rng, known(ANY_FAMILY, opts.family) ?? drawnFamily)
    const poly = shape.poly.map(([x, y]): Point => [50 + (x - 50) * SCALE, CY + (y - 50) * SCALE])
    const edge = resample(poly, TUFTS)
    // Both layers always draw their tufts, so turning one off would never move the other.
    const halo = fur(edge, g, 3.2, 2)
    const d = fur(edge, g, 1.8, 1.4)
    const fibres = edge.map(() => [g.float(2.2, 5), g.float(1.6, 3)] as const)

    const color = colorVars()
    // Named before the fuzz, so --avatar-c1 is the body here too; the fuzz is --avatar-c2.
    const fill = color(lch(b.l, b.c, b.h))
    const fuzz = color(lch(b.l + 0.06, b.c * 0.8, b.h))
    let out =
      // A paler fringe behind the body: the fuzz that catches the light.
      el('path', { d: halo, fill: fuzz, opacity: 0.55 }) +
      el('path', { d, fill }) +
      finishOver('soft', id, d)

    // Short fibres just inside the edge, light on the lit side and shaded on the other.
    let lit = ''
    let shade = ''
    edge.forEach(([x, y], i) => {
      if (i % 2) return
      const [inset, len] = fibres[i]!
      const cx = x + (50 - x) * (inset / 40)
      const cy = y + (CY - y) * (inset / 40)
      const ux = (x - 50) / (Math.hypot(x - 50, y - CY) || 1)
      const uy = (y - CY) / (Math.hypot(x - 50, y - CY) || 1)
      const seg = `M${num(cx)} ${num(cy)}l${num(ux * len)} ${num(uy * len)}`
      if (ux + uy < 0) lit += seg
      else shade += seg
    })
    const strokes = (path: string, stroke: string, opacity: number) =>
      el('path', {
        d: path,
        fill: 'none',
        stroke,
        'stroke-opacity': opacity,
        'stroke-width': 1.1,
        'stroke-linecap': 'round',
      })
    out += strokes(lit, '#fff', 0.32) + strokes(shade, lch(b.l - 0.22, b.c, b.h), 0.3)

    const tile = known(SHAPES, opts.shape)
    if (opts.backdrop === 'tint' || tile)
      out = backdrop(tile, `var(--avatar-bg, ${lch(0.95, 0.03, b.h)})`) + out

    const [x, y, r] = inscribed(poly)
    let wears = known(ACCESSORIES, opts.accessory) ?? drawnAccessory
    if (opts.face === false && EYEWEAR[wears]) wears = 'none'
    // The highest outline point near the face, and the outline point up and to one side.
    const box = bbox(poly)
    const above = poly.filter((p) => Math.abs(p[0] - x) < 6).map((p) => p[1])
    // The box top if no point is near: an empty Math.min is Infinity, which would give NaN art.
    const top = above.length ? Math.min(...above) : box.y
    const aim = Math.atan2(-1, dir * 0.75)
    const side = poly.reduce((best, p) =>
      Math.cos(Math.atan2(p[1] - y, p[0] - x) - aim) >
      Math.cos(Math.atan2(best[1] - y, best[0] - x) - aim)
        ? p
        : best,
    )
    out += wearOver(wears, {
      x,
      // A hat sits a little lower on a tall head, so its crown stays in the frame.
      top: Math.max(top, 19),
      width: box.w,
      side: [side[0] - dir * 2.5, side[1] + 2.5],
      dir,
      hue: b.h,
    })

    const picks: Record<string, unknown> = {
      palette,
      hue: Math.round(b.h),
      family: shape.family,
      accessory: wears,
    }
    if (tile) picks.shape = tile
    if (opts.face !== false) {
      const f = face(
        rng,
        { x, y, r, hue: b.h },
        opts,
        EYEWEAR[wears] ? (spread, ink) => eyewear(wears, spread, ink) : undefined,
      )
      out += f.svg
      picks.expression = f.expression
    }
    return { defs: finishDefs('soft', id, b.h), body: out, picks }
  },
}
