import type { Rendered, Style } from '../create.ts'
import { face, JOLLY, type Expression, type Mood } from '../parts/face.ts'
import {
  bbox,
  drawBubbles,
  finishDefs,
  finishOver,
  FINISHES,
  gummyDefs,
  gummyOver,
  gummyShadow,
  outline,
  type Finish,
} from '../parts/finish.ts'
import { known } from '../parts/known.ts'
import { PALETTES, pickBase, type PaletteName } from '../parts/palette.ts'
import type { Point } from '../parts/shape.ts'
import { backdrop, SHAPES, type Shape } from '../parts/tile.ts'
import { el, num, type Attrs } from '../svg.ts'
import { lch } from './paint.ts'

export type Critter =
  | 'cat'
  | 'sloth'
  | 'dog'
  | 'hamster'
  | 'rabbit'
  | 'ferret'
  | 'fox'
  | 'panda'
  | 'koala'
  | 'penguin'
  | 'deer'
  | 'frog'
  | 'owl'
  | 'chick'
  | 'axolotl'
  | 'lion'
  | 'pig'
  | 'mouse'
  | 'octopus'

export type CrittersOptions = {
  /** The animal. Unset: drawn from the seed. */
  animal?: Critter
  /** `natural` (default): hand-picked animal colours. `palette`: the seed's palette hue. */
  coat?: 'natural' | 'palette'
  /** Used with `coat: 'palette'`. */
  palette?: PaletteName
  face?: boolean
  mood?: Mood
  expression?: Expression
  /** Default `soft`: the vinyl light. */
  finish?: Finish
  backdrop?: 'none' | 'tint'
  shape?: Shape
}

type Lch = readonly [number, number, number]
/** Natural coats as OKLCH: fur, then the secondary (ears, patches). Two or three per animal. */
const COATS: Record<Critter, readonly (readonly [Lch, Lch])[]> = {
  cat: [
    [
      [0.8, 0.11, 292],
      [0.7, 0.12, 292],
    ],
    [
      [0.87, 0.09, 60],
      [0.78, 0.11, 50],
    ],
    [
      [0.84, 0.06, 240],
      [0.74, 0.07, 240],
    ],
  ],
  sloth: [
    [
      [0.8, 0.05, 70],
      [0.66, 0.06, 58],
    ],
    [
      [0.83, 0.045, 88],
      [0.7, 0.05, 78],
    ],
  ],
  dog: [
    [
      [0.86, 0.11, 70],
      [0.74, 0.11, 55],
    ],
    [
      [0.78, 0.08, 52],
      [0.64, 0.08, 46],
    ],
    [
      [0.92, 0.04, 80],
      [0.8, 0.07, 62],
    ],
  ],
  hamster: [
    [
      [0.88, 0.09, 65],
      [0.78, 0.11, 55],
    ],
    [
      [0.87, 0.035, 280],
      [0.76, 0.045, 280],
    ],
    [
      [0.9, 0.07, 40],
      [0.8, 0.09, 35],
    ],
  ],
  rabbit: [
    [
      [0.97, 0.012, 330],
      [0.9, 0.04, 330],
    ],
    [
      [0.93, 0.035, 60],
      [0.84, 0.05, 55],
    ],
    [
      [0.89, 0.03, 285],
      [0.8, 0.04, 285],
    ],
  ],
  ferret: [
    [
      [0.84, 0.025, 285],
      [0.6, 0.03, 285],
    ],
    [
      [0.88, 0.045, 62],
      [0.66, 0.05, 55],
    ],
  ],
  fox: [
    [
      [0.8, 0.15, 48],
      [0.62, 0.11, 38],
    ],
    [
      [0.88, 0.09, 75],
      [0.7, 0.09, 58],
    ],
  ],
  panda: [
    [
      [0.98, 0.008, 300],
      [0.46, 0.035, 300],
    ],
    [
      [0.98, 0.01, 60],
      [0.5, 0.035, 40],
    ],
  ],
  koala: [
    [
      [0.85, 0.03, 285],
      [0.76, 0.03, 285],
    ],
    [
      [0.84, 0.028, 245],
      [0.75, 0.028, 245],
    ],
  ],
  penguin: [
    [
      [0.58, 0.08, 262],
      [0.48, 0.07, 262],
    ],
    [
      [0.64, 0.08, 228],
      [0.54, 0.08, 228],
    ],
  ],
  deer: [
    [
      [0.82, 0.09, 64],
      [0.6, 0.07, 48],
    ],
    [
      [0.86, 0.07, 54],
      [0.64, 0.06, 42],
    ],
  ],
  frog: [
    [
      [0.86, 0.13, 140],
      [0.76, 0.13, 145],
    ],
    [
      [0.87, 0.1, 175],
      [0.77, 0.1, 180],
    ],
  ],
  owl: [
    [
      [0.82, 0.07, 62],
      [0.7, 0.08, 52],
    ],
    [
      [0.84, 0.05, 282],
      [0.72, 0.06, 282],
    ],
  ],
  chick: [
    [
      [0.93, 0.12, 96],
      [0.84, 0.14, 75],
    ],
  ],
  axolotl: [
    [
      [0.89, 0.07, 352],
      [0.78, 0.12, 2],
    ],
    [
      [0.89, 0.06, 300],
      [0.78, 0.1, 310],
    ],
  ],
  lion: [
    [
      [0.87, 0.1, 82],
      [0.75, 0.13, 58],
    ],
  ],
  pig: [
    [
      [0.9, 0.055, 10],
      [0.81, 0.085, 10],
    ],
  ],
  mouse: [
    [
      [0.86, 0.015, 270],
      [0.76, 0.02, 270],
    ],
    [
      [0.88, 0.03, 60],
      [0.78, 0.04, 55],
    ],
  ],
  octopus: [
    [
      [0.81, 0.11, 320],
      [0.71, 0.12, 325],
    ],
    [
      [0.82, 0.1, 250],
      [0.72, 0.11, 255],
    ],
    [
      [0.85, 0.1, 30],
      [0.75, 0.12, 30],
    ],
  ],
}
const NAMES = Object.keys(COATS) as Critter[]
export const CRITTERS = Object.fromEntries(NAMES.map((k) => [k, true])) as Record<Critter, true>
const COAT_KINDS = { natural: true, palette: true }
const BUN = 'M50 26C76 26 90 42 90 62C90 80 74 88 50 88C26 88 10 80 10 62C10 42 24 26 50 26Z'
const MIRROR = 'translate(100 0) scale(-1 1)'
const rot = (a: number, x: number, y: number) => `rotate(${num(a)} ${num(x)} ${num(y)})`
const P = (d: string, fill: string, x: Attrs = {}) => el('path', { d, fill, ...x })
const S = (d: string, stroke: string, w: number, x: Attrs = {}) =>
  el('path', {
    d,
    fill: 'none',
    stroke,
    'stroke-width': w,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    ...x,
  })
const C = (cx: number, cy: number, r: number, fill: string, x: Attrs = {}) =>
  el('circle', { cx, cy, r, fill, ...x })
const E = (cx: number, cy: number, rx: number, ry: number, fill: string, x: Attrs = {}) =>
  el('ellipse', { cx, cy, rx, ry, fill, ...x })
const mirror = (s: string) => s + el('g', { transform: MIRROR }, s)

/** Soft vinyl-toy animals on a wide bun head, with jolly faces. */
export const critters: Style<CrittersOptions> = {
  name: 'critters',
  defaults: { coat: 'natural', palette: 'vivid', face: true, finish: 'soft', backdrop: 'none' },
  render(ctx, opts): Rendered {
    const { rng, id } = ctx
    const finish = known(FINISHES, opts.finish) ?? 'soft'
    const palette = known(PALETTES, opts.palette) ?? 'vivid'
    // Every draw is always taken, in this order, so a set option never shifts the others.
    const g = rng.fork('critter')
    const drawn = g.pick(NAMES)
    const coatPick = g.int(0, 2)
    const pc = pickBase(rng, palette)
    const animal = known(CRITTERS, opts.animal) ?? drawn
    const usePalette = known(COAT_KINDS, opts.coat) === 'palette'
    const vi = coatPick % COATS[animal].length
    const pl = Math.min(Math.max(pc.l + 0.08, 0.8), 0.9)
    const [[l, c, h], [l2, c2, h2]] = usePalette
      ? ([
          [pl, pc.c * 0.8, pc.h],
          [pl - 0.1, pc.c * 0.9, pc.h],
        ] as const)
      : COATS[animal][vi]!
    const cream = lch(0.975, 0.018, h + 20)
    const pink = lch(0.85, 0.08, 8)
    const nose = lch(0.42, 0.04, 30)
    let gn = 0
    let defs = ''
    // A part's own light: bright centre top-left, the colour itself, a softer edge. Flat paints the colour.
    const vinyl = ([L, Ch, H]: Lch) => {
      if (finish === 'flat') return lch(L, Ch, H)
      const k = id('v' + ++gn)
      defs += el(
        'radialGradient',
        { id: k, cx: 0.4, cy: 0.34, r: 0.72 },
        el('stop', { offset: 0, 'stop-color': lch(Math.min(L + 0.07, 0.995), Ch * 0.75, H) }) +
          el('stop', { offset: 0.6, 'stop-color': lch(L, Ch, H) }) +
          el('stop', { offset: 1, 'stop-color': lch(L - 0.06, Ch * 1.05, H) }),
      )
      return `url(#${k})`
    }
    // Markings fade out at their edge instead of sitting on top like stickers.
    const mark = (col: string) => {
      const k = id('m' + ++gn)
      defs += el(
        'radialGradient',
        { id: k },
        el('stop', { offset: 0, 'stop-color': col }) +
          el('stop', { offset: 0.7, 'stop-color': col }) +
          el('stop', { offset: 1, 'stop-color': col, 'stop-opacity': 0 }),
      )
      return `url(#${k})`
    }
    const fur = vinyl([l, c, h])
    const fur2 = vinyl([l2, c2, h2])
    const creamFill = vinyl([0.975, 0.018, h + 20])
    const second = lch(l2, c2, h2)

    let back = ''
    let front = ''
    let fy = 57
    let head = BUN
    switch (animal) {
      case 'cat':
        back += mirror(
          P('M15 50L20 14Q22 9 27 12L46 30Z', fur) +
            P('M22 40L24 22L36 31Z', pink, { opacity: 0.85 }),
        )
        front += E(50, 63, 2.4, 1.7, lch(0.74, 0.11, 8))
        break
      case 'sloth':
        front += E(50, 62, 26, 20, mark(lch(0.95, 0.025, 75)))
        front += mirror(E(38.5, 56, 8.5, 6, mark(second), { transform: rot(20, 38.5, 56) }))
        front += E(50, 64.5, 3, 2.1, nose)
        fy = 58
        break
      case 'dog':
        back += mirror(E(17, 52, 10.5, 19, fur2, { transform: rot(24, 17, 52) }))
        front +=
          P('M50 31Q44 44 45.5 58L54.5 58Q56 44 50 31Z', mark(cream)) +
          P('M16 67Q30 56 50 60Q70 56 84 67Q85 87 50 88Q15 87 16 67Z', creamFill) +
          E(50, 60, 3.2, 2.3, nose)
        fy = 55
        break
      case 'hamster':
        back += mirror(C(27, 31, 8.5, fur2) + C(27, 31, 4.6, pink))
        head = 'M50 28C72 28 84 40 86 54C93 62 92 84 50 88C8 84 7 62 14 54C16 40 28 28 50 28Z'
        front +=
          P('M11 63Q30 55 50 60Q70 55 89 63Q90 86 50 88Q10 86 11 63Z', creamFill) +
          E(50, 36, 9, 8, mark(second)) +
          E(50, 61, 2.4, 1.8, lch(0.74, 0.11, 8))
        fy = 56
        break
      case 'rabbit':
        back += mirror(
          E(37, 21, 7.5, 21, fur, { transform: rot(-8, 37, 21) }) +
            E(37, 23, 3.8, 15, pink, { transform: rot(-8, 37, 23) }),
        )
        front += E(50, 61, 2.4, 1.7, lch(0.74, 0.11, 8))
        break
      case 'ferret':
        back += mirror(
          P('M18 46L22 16Q24 12 28 14L44 30Z', fur) + P('M24 38L26 22L35 29Z', creamFill),
        )
        front +=
          P(
            'M13 57Q26 44 40 50Q50 54 60 50Q74 44 87 57Q78 66 64 61Q50 57 36 61Q22 66 13 57Z',
            mark(second),
            { opacity: 0.7 },
          ) +
          E(50, 70, 13, 9, creamFill) +
          E(50, 62, 3, 2.2, nose)
        fy = 56
        break
      case 'fox':
        back += mirror(
          P('M13 50L17 8L46 30Z', fur) +
            P('M17 8L15.6 20L25 15Z', fur2) +
            P('M20 40L22 20L36 30Z', creamFill),
        )
        head = 'M50 28C74 28 86 40 88 54L95 65Q80 84 50 87Q20 84 5 65L12 54C14 40 26 28 50 28Z'
        front +=
          P(
            'M7 65Q24 60 36 64Q44 70 50 70Q56 70 64 64Q76 60 93 65Q80 85 50 87Q20 85 7 65Z',
            creamFill,
          ) + E(50, 62, 2.8, 2, nose)
        fy = 56
        break
      case 'panda':
        back += mirror(C(23, 32, 11, fur2))
        front += mirror(
          E(38, 56, 8.5, 10.5, mark(lch(Math.min(l2 + 0.14, 0.7), c2, h2)), {
            transform: rot(24, 38, 56),
          }),
        )
        front += E(50, 63, 3, 2.2, nose)
        break
      case 'koala': {
        let tufts = ''
        for (let a = 115; a <= 295; a += 30)
          tufts += C(
            22 + 14.5 * Math.cos((a * Math.PI) / 180),
            40 + 14.5 * Math.sin((a * Math.PI) / 180),
            4.6,
            fur,
          )
        back += mirror(tufts + C(22, 40, 15.5, fur) + C(23, 41, 9, pink))
        front += P(
          'M50 45.5C54.6 45.5 56 49 55.6 53.5C55.2 58 53 59.6 50 59.6C47 59.6 44.8 58 44.4 53.5C44 49 45.4 45.5 50 45.5Z',
          vinyl([0.46, 0.02, h]),
        )
        fy = 50
        break
      }
      case 'penguin':
        front += P(
          'M50 40C42 31 21 34 19 52C17 70 31 85 50 85C69 85 83 70 81 52C79 34 58 31 50 40Z',
          creamFill,
        )
        front += P('M46.6 56.4L53.4 56.4L50 60.8Z', vinyl([0.84, 0.14, 72]), {
          stroke: lch(0.82, 0.14, 72),
          'stroke-width': 1.6,
          'stroke-linejoin': 'round',
        })
        fy = 54
        break
      case 'deer':
        back += mirror(S('M38 30L31 10M32.6 15L23 10M34 20L26.5 18', second, 3.4))
        back += mirror(
          E(16, 43, 12, 6.5, fur, { transform: rot(-24, 16, 43) }) +
            E(17, 43, 7, 3.4, creamFill, { transform: rot(-24, 17, 43) }),
        )
        front +=
          C(40, 36, 2, cream) +
          C(46, 31.5, 1.5, cream) +
          C(58, 34, 2, cream) +
          C(63, 40, 1.5, cream)
        front += E(50, 70, 13, 9, creamFill) + E(50, 63, 3, 2.2, nose)
        fy = 55
        break
      case 'frog':
        // A wide, flat head with two eye domes on top and a pale chin.
        head = 'M50 36C80 36 94 50 94 66C94 82 76 88 50 88C24 88 6 82 6 66C6 50 20 36 50 36Z'
        back += mirror(C(29, 36, 13, fur) + C(29, 35, 7.5, creamFill))
        front += P('M16 72Q32 66 50 69Q68 66 84 72Q78 86 50 87Q22 86 16 72Z', creamFill)
        front += mirror(
          C(26, 62, 1.4, lch(l2 - 0.12, c2, h2)) + C(22, 58, 1, lch(l2 - 0.12, c2, h2)),
        )
        fy = 60
        break
      case 'owl':
        // A tall egg with ear tufts, a feather V and pale eye discs; the beak sits between eyes and mouth.
        head = 'M50 20C74 20 88 38 88 60C88 80 72 90 50 90C28 90 12 80 12 60C12 38 26 20 50 20Z'
        back += mirror(P('M16 34L20 10L38 24Z', fur2))
        front += P('M30 30Q40 36 50 44Q60 36 70 30Q60 40 50 50Q40 40 30 30Z', mark(second), {
          opacity: 0.6,
        })
        front += mirror(C(38.5, 58, 11, mark(cream)))
        front += P('M47.6 61L52.4 61L50 65.6Z', vinyl([0.84, 0.13, 72]), {
          stroke: lch(0.82, 0.13, 72),
          'stroke-width': 1.4,
          'stroke-linejoin': 'round',
        })
        front += S('M30 78Q35 82 40 78M45 82Q50 86 55 82M60 78Q65 82 70 78', second, 1.6, {
          opacity: 0.6,
        })
        fy = 57
        break
      case 'chick':
        // A round puff with a three-curl tuft and little wings.
        head = 'M50 24C74 24 88 40 88 60C88 80 72 90 50 90C28 90 12 80 12 60C12 40 26 24 50 24Z'
        back += S('M50 26Q44 14 50 10M50 26Q54 14 62 14M50 26Q46 18 40 16', second, 4)
        front += mirror(P('M14 64Q8 72 16 80Q22 76 22 68Z', fur2))
        front += P('M46.4 62L53.6 62L50 67Z', vinyl([0.8, 0.15, 55]), {
          stroke: lch(0.78, 0.15, 55),
          'stroke-width': 1.4,
          'stroke-linejoin': 'round',
        })
        fy = 58
        break
      case 'axolotl':
        // A wide head with three feathery gills on each side.
        head = 'M50 30C78 30 90 44 90 62C90 80 74 88 50 88C26 88 10 80 10 62C10 44 22 30 50 30Z'
        back += mirror(
          E(14, 40, 4, 11, fur2, { transform: rot(-50, 14, 40) }) +
            E(9, 54, 4, 11, fur2, { transform: rot(-80, 9, 54) }) +
            E(12, 68, 4, 10, fur2, { transform: rot(-110, 12, 68) }),
        )
        front += mirror(C(30, 70, 1.4, second))
        fy = 60
        break
      case 'lion': {
        // A ring of mane puffs behind the bun head, round ears and a cream muzzle.
        let mane = ''
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2
          mane += C(50 + 38 * Math.cos(a), 58 + 34 * Math.sin(a), 11, fur2)
        }
        back += mane + mirror(C(27, 32, 7, fur) + C(27, 32, 3.6, pink))
        head = 'M50 28C72 28 84 42 84 60C84 78 70 86 50 86C30 86 16 78 16 60C16 42 28 28 50 28Z'
        front += E(50, 70, 13, 9, creamFill) + E(50, 63, 3, 2.2, lch(0.5, 0.06, 30))
        fy = 56
        break
      }
      case 'pig':
        // Folded ears and a soft snout between the eyes and the mouth.
        back += mirror(P('M18 46L22 18Q24 14 28 16L44 32Z', fur2))
        front += mirror(P('M22 36L26 24L34 32Z', pink, { opacity: 0.8 }))
        front +=
          E(50, 62, 7, 4.6, vinyl([l2, c2, h2])) +
          C(47.6, 62, 1.2, lch(0.55, 0.08, 10)) +
          C(52.4, 62, 1.2, lch(0.55, 0.08, 10))
        fy = 55
        break
      case 'mouse':
        // Huge round ears on the sides, a tiny pink nose and whiskers.
        back += mirror(C(18, 40, 15, fur2) + C(18, 40, 9.5, pink))
        front += E(50, 62, 2.2, 1.6, lch(0.74, 0.11, 8))
        front += mirror(S('M30 62L18 60M30 65L19 67', lch(l2 - 0.1, c2, h2), 1, { opacity: 0.6 }))
        fy = 57
        break
      case 'octopus':
        // A tall dome with a scalloped hem of curled tentacles.
        head =
          'M50 16C74 16 86 34 86 56L86 72Q84 82 77 78Q72 88 64 82Q58 92 50 84Q42 92 36 82Q28 88 23 78Q16 82 14 72L14 56C14 34 26 16 50 16Z'
        front += mirror(
          C(30, 40, 3, second, { opacity: 0.55 }) + C(24, 50, 2, second, { opacity: 0.55 }),
        )
        fy = 55
        break
    }

    // Points on the head's outline (not its control points), for the box, shadow, highlight and bubbles.
    const pts = outline(head)
    const box = bbox(pts)
    const shadowId = id('sh')
    defs += el(
      'radialGradient',
      { id: shadowId },
      el('stop', { offset: 0, 'stop-color': lch(0.4, 0.05, h), 'stop-opacity': 0.22 }) +
        el('stop', { offset: 1, 'stop-color': lch(0.4, 0.05, h), 'stop-opacity': 0 }),
    )
    const hlId = id('hl')
    defs += el(
      'radialGradient',
      { id: hlId },
      el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.8 }) +
        el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 }),
    )
    const sx = box.x + box.w * 0.3
    const sy = box.y + box.h * 0.2
    const faceAt = { x: 50, y: fy + 22 * 0.08, r: 22 }
    let out = E(50, 92, 32, 4, `url(#${shadowId})`) + back + P(head, fur)
    if (finish === 'gummy') {
      const base = { l, c, h }
      defs += gummyDefs(id, lch(Math.min(l + 0.14, 0.97), c * 0.7, h), base)
      out =
        gummyShadow(id, box) +
        out +
        gummyOver(
          id,
          head,
          box,
          pts,
          [50, box.y + box.h / 2],
          drawBubbles(rng.fork('gummy'), pts.length),
          opts.face !== false ? [50, fy, 22] : undefined,
        )
    } else out += finishOver(finish === 'gloss' ? 'gloss' : 'flat', id, head, box)
    if (finish === 'gloss') defs += finishDefs('gloss', id, h)
    out += front
    if (finish !== 'flat')
      out += E(sx, sy, box.w * 0.16, box.h * 0.07, `url(#${hlId})`, { transform: rot(-24, sx, sy) })

    const tile = known(SHAPES, opts.shape)
    if (opts.backdrop === 'tint' || tile)
      out = backdrop(tile, `var(--avatar-bg, ${lch(0.95, 0.03, h)})`) + out
    const picks: Record<string, unknown> = {
      animal,
      coat: usePalette ? 'palette' : 'natural',
      hue: Math.round(h),
    }
    // Which of the animal's natural coats; `coat` stays a value the option takes back.
    if (!usePalette) picks.variant = vi
    if (finish !== 'soft') picks.finish = finish
    if (tile) picks.shape = tile
    if (opts.face !== false) {
      // Jolly unless asked: happy and playful only, blush always on.
      const f = face(
        rng,
        { ...faceAt, hue: h },
        { mood: opts.mood, expression: opts.expression, pool: JOLLY, blush: true },
      )
      out += f.svg
      picks.expression = f.expression
    }
    return { defs, body: out, picks }
  },
}
