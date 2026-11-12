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
import { bbox, type Box } from '../parts/finish.ts'
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
/** Squashed wider and lower, as if the jelly settled under its own weight. */
const SX = 0.94
const SY = 0.8
const CY = 54
/** How far the seeded outline is pulled toward an even oval: rounder, like a gummy sweet. */
const ROUND = 0.45
/** Points around the outline: enough for smooth drips, few enough to keep the SVG small. */
const POINTS = 96
/** Drips spread evenly along the bottom, so the edge wobbles like jelly sliding off a spoon. */
const DRIPS = 5
const BUBBLES = 4

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

/** A smooth closed path: each point is a control point between the midpoints of its two edges. */
function smooth(pts: Point[]): string {
  const n = pts.length
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const m0 = mid(pts[n - 1]!, pts[0]!)
  let d = `M${num(m0[0])} ${num(m0[1])}`
  pts.forEach((p, i) => {
    const m = mid(p, pts[(i + 1) % n]!)
    d += `Q${num(p[0])} ${num(p[1])} ${num(m[0])} ${num(m[1])}`
  })
  return d + 'Z'
}

/**
 * The lower half sags into a row of seeded drips; the top is untouched, so hats sit as before.
 * Every drip takes its three draws, always.
 */
function sag(pts: Point[], g: Rng, box: Box): Point[] {
  const drips = Array.from(
    { length: DRIPS },
    (_, k) =>
      [
        -0.72 + (k * 1.44) / (DRIPS - 1) + g.float(-0.06, 0.06),
        g.float(2.5, 6),
        g.float(0.09, 0.13),
      ] as const,
  )
  const half = box.h / 2 || 1
  return pts.map(([x, y]): Point => {
    const low = Math.min(1, Math.max(0, (y - CY) / half))
    const u = (x - 50) / (box.w / 2 || 1)
    let dy = 0
    for (const [at, depth, width] of drips) dy += depth * Math.exp(-(((u - at) / width) ** 2))
    return [x, y + dy * low * low]
  })
}

/** Gummy critters: a clear-looking body with drips, bubbles, a face, and now and then something to wear. */
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
    const radius = shape.poly.map(([x, y]) => Math.hypot(x - 50, y - 50))
    const mean = radius.reduce((a, v) => a + v, 0) / radius.length
    const poly = shape.poly.map(([x, y], i): Point => {
      const k = (radius[i]! * (1 - ROUND) + mean * ROUND) / (radius[i]! || 1)
      return [50 + (x - 50) * k * SX, CY + (y - 50) * k * SY]
    })
    const edge = sag(resample(poly, POINTS), g, bbox(poly))
    const shown = g.int(2, BUBBLES)
    const bubbles = Array.from(
      { length: BUBBLES },
      () => [g.int(0, POINTS - 1), g.float(5, 9), g.float(1.3, 2.6)] as const,
    )
    const d = smooth(edge)
    const body = bbox(edge)
    const [x, y, r] = inscribed(poly)

    const color = colorVars()
    // Named first, so --avatar-c1 is the body here too; the light gummy centre is --avatar-c2.
    const fill = color(lch(b.l, b.c, b.h))
    const glow = color(lch(Math.min(b.l + 0.14, 0.97), b.c * 0.7, b.h))
    const deep = lch(b.l - 0.2, b.c, b.h)
    const stop = (offset: number, c: string, o: number) =>
      el('stop', { offset, 'stop-color': c, 'stop-opacity': o })
    const defs =
      // Brighter in the middle, deeper at the edge: reads as clear without letting the page through.
      el(
        'radialGradient',
        { id: id('jg'), cx: 0.45, cy: 0.4, r: 0.65 },
        stop(0, glow, 0.9) + stop(0.5, glow, 0) + stop(0.62, deep, 0) + stop(1, deep, 0.5),
      ) +
      el('radialGradient', { id: id('jh') }, stop(0, '#fff', 0.8) + stop(1, '#fff', 0)) +
      el(
        'radialGradient',
        { id: id('js') },
        stop(0, lch(0.3, 0.08, b.h), 0.32) + stop(1, lch(0.3, 0.08, b.h), 0),
      )

    const hx = body.x + body.w * 0.3
    const hy = body.y + body.h * 0.2
    let out =
      // A soft shadow pooled underneath, kept inside the frame.
      el('ellipse', {
        cx: num(body.x + body.w / 2),
        cy: num(Math.min(body.y + body.h + 1, 96)),
        rx: num(body.w * 0.46),
        ry: 3.2,
        fill: `url(#${id('js')})`,
      }) +
      el('path', { d, fill }) +
      el('path', { d, fill: `url(#${id('jg')})` }) +
      el('ellipse', {
        cx: num(hx),
        cy: num(hy),
        rx: num(body.w * 0.17),
        ry: num(body.h * 0.08),
        transform: `rotate(-22 ${num(hx)} ${num(hy)})`,
        fill: `url(#${id('jh')})`,
      })
    // Clear bubbles just inside the edge; any that would sit on the face are left out.
    for (const [i, inset, br] of bubbles.slice(0, shown)) {
      const [px, py] = edge[i]!
      const dist = Math.hypot(50 - px, CY - py) || 1
      const bx = px + ((50 - px) * inset) / dist
      const by = py + ((CY - py) * inset) / dist
      if (opts.face !== false && Math.hypot(bx - x, by - y) < r * 0.9) continue
      out += el('circle', {
        cx: num(bx),
        cy: num(by),
        r: num(br),
        fill: '#fff',
        'fill-opacity': 0.3,
        stroke: '#fff',
        'stroke-opacity': 0.6,
        'stroke-width': 0.6,
      })
    }

    const tile = known(SHAPES, opts.shape)
    if (opts.backdrop === 'tint' || tile)
      out = backdrop(tile, `var(--avatar-bg, ${lch(0.95, 0.03, b.h)})`) + out

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
    return { defs, body: out, picks }
  },
}
