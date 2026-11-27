import { hexToOklch, oklchToHex } from '../color.ts'
import type { Rendered, Style } from '../create.ts'
import { face, JOLLY, type Expression, type Mood } from '../parts/face.ts'
import { known } from '../parts/known.ts'
import { SHAPES, type Shape } from '../parts/tile.ts'
import { num as n } from '../svg.ts'
import { lch as L } from './paint.ts'

export type CosmosObject =
  | 'sun'
  | 'galaxy'
  | 'black hole'
  | 'nebula'
  | 'comet'
  | 'moon'
  | 'crescent'
  | 'star'
  | 'quasar'
  | 'pulsar'
  | 'ufo'
  | 'rocket'
  | 'asteroid'
  | 'supernova'
  | 'satellite'

export type CosmosOptions = {
  /** The space object. Unset: drawn from the seed. */
  object?: CosmosObject
  /** Index of the object's colour theme. Unset or out of range: drawn from the seed. */
  tone?: number
  face?: boolean
  mood?: Mood
  expression?: Expression
  /** Puts the object on a soft night-sky tile in this outline. Unset: no tile. */
  shape?: Shape
}

/**
 * Hue turns per object, in degrees; 0 is the reference look. Each set was picked by eye to stay
 * pleasant: a sun can go coral or lilac but never green, and no theme lands in olive or brown.
 */
const THEMES: Record<CosmosObject, readonly number[]> = {
  sun: [0, -20, 300],
  galaxy: [0, 60, -70],
  'black hole': [0, -90, 40],
  nebula: [0, 50, -80],
  comet: [0, 160, 260],
  moon: [0, 60, -80],
  crescent: [0, 260, 180],
  star: [0, -25, 290],
  quasar: [0, -90, 60],
  pulsar: [0, 90, -40, 130],
  ufo: [0, 120, -60],
  rocket: [0, 200, -50],
  asteroid: [0, -60, 80],
  supernova: [0, -60, 90],
  satellite: [0, 140, -70],
}
const NAMES = Object.keys(THEMES) as CosmosObject[]
export const COSMOS = Object.fromEntries(NAMES.map((k) => [k, true])) as Record<CosmosObject, true>

/** Turns every coloured hex in `svg` by `dh` degrees; whites and greys (low chroma) stay as they are. */
export function recolor(svg: string, dh: number): string {
  return svg.replace(/(?<!url\()#[0-9a-f]{6}\b/gi, (hex) => {
    const c = hexToOklch(hex)
    return c.c < 0.02 ? hex : oklchToHex({ ...c, h: (((c.h + dh) % 360) + 360) % 360 })
  })
}

type Stop = readonly [number, string, number?]

/** Glowing pastel space objects with their own gradient light, a soft glow and a few sparkles. */
export const cosmos: Style<CosmosOptions> = {
  name: 'cosmos',
  defaults: { face: true },
  render(ctx, opts): Rendered {
    const { rng, id } = ctx
    // Every draw is always taken, in this order, so a set option never shifts the others.
    const drawn = rng.fork('cosmos').pick(NAMES)
    const object = known(COSMOS, opts.object) ?? drawn
    let defs = ''
    const stops = (list: readonly Stop[]) =>
      list
        .map(
          ([off, col, op = 1]) =>
            `<stop offset="${off}" stop-color="${col}" stop-opacity="${op}"/>`,
        )
        .join('')
    const radial = (k: string, list: readonly Stop[], a = 'cx=".4" cy=".34" r=".72"') => {
      defs += `<radialGradient id="${id(k)}" ${a}>${stops(list)}</radialGradient>`
      return `url(#${id(k)})`
    }
    const linear = (k: string, list: readonly Stop[], a = 'x1="0" y1="0" x2="1" y2="1"') => {
      defs += `<linearGradient id="${id(k)}" ${a}>${stops(list)}</linearGradient>`
      return `url(#${id(k)})`
    }
    // A body's own light, from three OKLCH tones: light centre, colour, softer edge.
    const ball = (k: string, [l, c, h]: readonly [number, number, number]) =>
      radial(k, [
        [0, L(Math.min(l + 0.12, 0.995), c * 0.6, h)],
        [0.6, L(l, c, h)],
        [1, L(l - 0.06, c, h + 12)],
      ])
    const glow = (k: string, col: string, op = 0.45) =>
      radial(
        k,
        [
          [0, col, op],
          [1, col, 0],
        ],
        'cx=".5" cy=".5" r=".5"',
      )
    const twinkle = (x: number, y: number, r: number, col: string) =>
      `<path d="M${n(x)} ${n(y - r)}Q${n(x + r * 0.18)} ${n(y - r * 0.18)} ${n(x + r)} ${n(y)}Q${n(x + r * 0.18)} ${n(y + r * 0.18)} ${n(x)} ${n(y + r)}Q${n(x - r * 0.18)} ${n(y + r * 0.18)} ${n(x - r)} ${n(y)}Q${n(x - r * 0.18)} ${n(y - r * 0.18)} ${n(x)} ${n(y - r)}Z" fill="${col}"/>`
    const sparkles = (cols: readonly string[]) => {
      const s = rng.fork('sparkles')
      let out = ''
      for (let i = 0; i < 5; i++) {
        const a = s.float(0, 6.28)
        const d = s.float(38, 46)
        const x = 50 + d * Math.cos(a)
        const y = 50 + d * Math.sin(a)
        out +=
          i % 2
            ? `<circle cx="${n(x)}" cy="${n(y)}" r="${n(s.float(1, 1.8))}" fill="${cols[i % cols.length]}" opacity=".8"/>`
            : twinkle(x, y, s.float(2.4, 3.6), cols[i % cols.length]!)
      }
      return out
    }
    const shine = (x: number, y: number, rx: number, ry: number) =>
      `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(-28 ${x} ${y})" fill="${radial(
        'hl' + x,
        [
          [0, '#fff', 0.85],
          [1, '#fff', 0],
        ],
        'cx=".5" cy=".5" r=".5"',
      )}"/>`
    const rings = (
      cx: number,
      cy: number,
      rx: number,
      ry: number,
      a: number,
      stroke: string,
      w: number,
      half: 0 | 1,
    ) =>
      `<path d="M${cx - rx} ${cy}A${rx} ${ry} 0 0 ${half} ${cx + rx} ${cy}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" transform="rotate(${a} ${cx} ${cy})"/>`
    const burst = (count: number, cx: number, cy: number, r: (i: number) => number) => {
      let d = 'M'
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / count
        d += `${n(cx + r(i) * Math.cos(a))} ${n(cy + r(i) * Math.sin(a))}${i < count - 1 ? 'L' : 'Z'}`
      }
      return d
    }

    let out = ''
    let fx = 50
    let fy = 52
    let fr = 19
    let hue = 280
    let ink: string | undefined
    switch (object) {
      case 'sun': {
        hue = 70
        const f = radial(
          'sun',
          [
            [0, '#fff3b0'],
            [0.55, '#ffc53d'],
            [1, '#ff8a3d'],
          ],
          'cx=".45" cy=".42" r=".6"',
        )
        out +=
          `<circle cx="50" cy="52" r="48" fill="${glow('g', '#ffb347')}"/><path d="${burst(24, 50, 52, (i) => (i % 2 ? 31 : 41))}" fill="${f}" stroke="#ffb84a" stroke-width="5" stroke-linejoin="round"/>` +
          shine(38, 36, 9, 4.5) +
          sparkles(['#ffd36b', '#ff9fb2'])
        fy = 54
        break
      }
      case 'galaxy': {
        hue = 300
        // One solid swirl, no gaps: a filled disc in a blue-violet-pink sweep, two thick arms, and light
        // swirl lines on top to show the spin.
        const sweep = linear(
          'sw',
          [
            [0, '#5fb8ff'],
            [0.45, '#a77bff'],
            [1, '#ff8fc8'],
          ],
          'x1="0" y1="0" x2="1" y2=".7"',
        )
        const arm = (k: number) => {
          const pts: string[] = []
          for (let i = 0; i <= 20; i++) {
            const t = i / 20
            const a = k * Math.PI + 0.5 + t * 1.25 * Math.PI
            const r = 18 + t * 22
            pts.push(`${n(50 + r * Math.cos(a))} ${n(50 + r * Math.sin(a) * 0.66)}`)
          }
          return pts.join('L')
        }
        out +=
          `<circle cx="50" cy="50" r="47" fill="${glow('g', '#b48cff', 0.35)}"/><g transform="rotate(-20 50 50)">` +
          [0, 1]
            .map(
              (k) =>
                `<path d="M${arm(k)}" fill="none" stroke="${sweep}" stroke-width="16" stroke-linecap="round"/>`,
            )
            .join('') +
          `<ellipse cx="50" cy="50" rx="33" ry="23" fill="${sweep}"/>` +
          [0, 1]
            .map(
              (k) =>
                `<path d="M${arm(k)}" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".45"/>`,
            )
            .join('') +
          `</g><circle cx="50" cy="50" r="16" fill="${glow('core', '#fff3fb', 0.85)}"/>` +
          shine(36, 38, 8, 3.5) +
          sparkles(['#fff', '#ffc2e2', '#a9dcff'])
        fy = 51
        fr = 16
        break
      }
      case 'black hole': {
        hue = 300
        ink = '#fff6ff'
        const disk = linear(
          'disk',
          [
            [0, '#9b7bff'],
            [0.5, '#ffb3d9'],
            [1, '#ffcf7a'],
          ],
          'x1="0" y1="0" x2="1" y2="0"',
        )
        out +=
          `<circle cx="50" cy="50" r="46" fill="${glow('g', '#b48cff', 0.4)}"/>` +
          rings(50, 52, 44, 12, -14, disk, 6, 1) +
          `<circle cx="50" cy="50" r="23" fill="${radial('core', [
            [0, '#6a55a8'],
            [0.7, '#4a3a80'],
            [1, '#382b66'],
          ])}"/><circle cx="50" cy="50" r="23" fill="none" stroke="#c9a8ff" stroke-width="1.6" opacity=".7"/>` +
          rings(50, 52, 44, 12, -14, disk, 6, 0) +
          sparkles(['#fff', '#ffc2e2'])
        fy = 49
        fr = 17
        break
      }
      case 'nebula': {
        hue = 280
        const puffs = [
          [34, 54, 17, [0.8, 0.1, 300]],
          [64, 56, 17, [0.82, 0.09, 240]],
          [50, 40, 19, [0.84, 0.09, 330]],
          [48, 62, 18, [0.82, 0.08, 270]],
          [72, 42, 11, [0.86, 0.08, 200]],
        ] as const
        out +=
          `<circle cx="50" cy="52" r="46" fill="${glow('g', '#c3a2ff', 0.4)}"/>` +
          puffs
            .map(
              ([x, y, r, c], i) =>
                `<circle cx="${x}" cy="${y}" r="${r}" fill="${ball('p' + i, c)}"/>`,
            )
            .join('') +
          shine(42, 32, 8, 4) +
          sparkles(['#fff', '#ffd6f0', '#c8ecff'])
        fy = 54
        fr = 18
        break
      }
      case 'comet': {
        hue = 60
        const tail = (k: string, c1: string, c2: string) =>
          linear(
            k,
            [
              [0, c1, 0.95],
              [1, c2, 0],
            ],
            'x1="0" y1="1" x2="1" y2="0"',
          )
        out +=
          `<path d="M30 58Q48 28 92 10Q70 34 50 70Z" fill="${tail('t1', '#ffb347', '#ff7ab8')}"/><path d="M36 68Q60 50 94 30Q72 52 52 76Z" fill="${tail('t2', '#ff8fb8', '#c58cff')}" opacity=".85"/>` +
          `<circle cx="38" cy="64" r="30" fill="${glow('g', '#ffd36b', 0.4)}"/><circle cx="38" cy="64" r="21" fill="${ball('h', [0.88, 0.13, 85])}"/>` +
          shine(30, 54, 6, 3) +
          sparkles(['#fff', '#ffd36b'])
        fx = 38
        fy = 64
        fr = 16
        break
      }
      case 'moon':
        hue = 290
        out +=
          `<circle cx="50" cy="51" r="46" fill="${glow('g', '#b9a8ff', 0.35)}"/><circle cx="50" cy="51" r="32" fill="${ball('m', [0.8, 0.06, 290])}"/>` +
          [
            [34, 38, 5],
            [68, 64, 6.5],
            [64, 34, 3.4],
            [31, 66, 3.6],
          ]
            .map(
              ([x, y, r], i) =>
                `<circle cx="${x}" cy="${y}" r="${r}" fill="${ball('c' + i, [0.7, 0.06, 290])}" opacity=".8"/>`,
            )
            .join('') +
          shine(40, 33, 8, 4) +
          sparkles(['#fff', '#d9ccff'])
        fy = 52
        fr = 20
        break
      case 'crescent':
        hue = 80
        out +=
          `<circle cx="46" cy="52" r="44" fill="${glow('g', '#ffd36b', 0.35)}"/><path d="M62 12A40 40 0 1 0 88 72A31 31 0 1 1 62 12Z" fill="${ball('c', [0.88, 0.12, 80])}"/>` +
          shine(30, 34, 7, 3.5) +
          twinkle(78, 22, 5, '#ffd36b') +
          twinkle(84, 40, 3, '#c58cff') +
          sparkles(['#fff'])
        fx = 38
        fy = 56
        fr = 15
        break
      case 'star':
        hue = 80
        out +=
          `<circle cx="50" cy="54" r="46" fill="${glow('g', '#ffd36b', 0.45)}"/><path d="${burst(10, 50, 55, (i) => (i % 2 ? 19 : 40))}" fill="${ball('s', [0.88, 0.14, 88])}" stroke="#ffd04a" stroke-width="7" stroke-linejoin="round"/>` +
          shine(40, 38, 6, 3) +
          [
            [16, 20],
            [86, 22],
            [12, 70],
            [88, 72],
          ]
            .map(
              ([x, y]) =>
                `<path d="M${x} ${y! - 3}L${x} ${y! + 3}M${x! - 3} ${y}L${x! + 3} ${y}" stroke="#ffc53d" stroke-width="1.8" stroke-linecap="round"/>`,
            )
            .join('')
        fy = 58
        fr = 16
        break
      case 'quasar': {
        hue = 300
        // A blazing core with twin jets through it and a bright disc around it.
        const jet = linear(
          'jet',
          [
            [0, '#a9e8ff', 0],
            [0.5, '#ffffff'],
            [1, '#a9e8ff', 0],
          ],
          'x1="0" y1="0" x2="0" y2="1"',
        )
        const disk = linear(
          'disk',
          [
            [0, '#a77bff'],
            [0.5, '#ff9fd0'],
            [1, '#ffcf7a'],
          ],
          'x1="0" y1="0" x2="1" y2="0"',
        )
        out +=
          `<circle cx="50" cy="50" r="44" fill="${glow('g', '#c3a2ff', 0.45)}"/><g transform="rotate(10 50 50)"><path d="M47.6 2L52.4 2L54 50L52.4 98L47.6 98L46 50Z" fill="${jet}"/></g>` +
          rings(50, 52, 44, 11, -12, disk, 6.5, 1) +
          `<circle cx="50" cy="50" r="18" fill="${ball('core', [0.92, 0.07, 310])}"/><circle cx="50" cy="50" r="22" fill="${glow('halo', '#fff', 0.6)}"/>` +
          rings(50, 52, 44, 11, -12, disk, 6.5, 0) +
          sparkles(['#fff', '#a9e8ff', '#ffc2e2'])
        fy = 50
        fr = 14
        break
      }
      case 'ufo':
        hue = 300
        // A glass dome holds the face; the saucer below carries a ring of little lights.
        out +=
          `<circle cx="50" cy="52" r="46" fill="${glow('g', '#c3a2ff', 0.4)}"/><path d="M38 76L30 94H70L62 76Z" fill="${linear(
            'beam',
            [
              [0, '#fff3b0', 0.6],
              [1, '#fff3b0', 0],
            ],
            'x1="0" y1="0" x2="0" y2="1"',
          )}"/>` +
          `<ellipse cx="50" cy="44" rx="24" ry="24" fill="${ball('dome', [0.93, 0.05, 200])}"/>` +
          `<ellipse cx="50" cy="64" rx="42" ry="12" fill="${ball('saucer', [0.82, 0.11, 300])}"/><ellipse cx="50" cy="60" rx="30" ry="5" fill="#fff" opacity=".35"/>` +
          [16, 30, 50, 70, 84]
            .map(
              (x, i) =>
                `<circle cx="${x}" cy="${i % 4 ? 68 : 65}" r="2.6" fill="${['#ffd36b', '#ff9fd0', '#a9e8ff'][i % 3]}"/>`,
            )
            .join('') +
          shine(40, 30, 7, 3.5) +
          sparkles(['#fff', '#ffd6f0'])
        fy = 40
        fr = 15
        break
      case 'rocket': {
        hue = 20
        // A cream capsule with a coral nose and fins and a warm flame.
        const flame = radial(
          'fl',
          [
            [0, '#fff3b0'],
            [0.5, '#ffc53d'],
            [1, '#ff8a3d', 0],
          ],
          'cx=".5" cy=".2" r=".8"',
        )
        out +=
          `<circle cx="50" cy="50" r="46" fill="${glow('g', '#ffb38a', 0.35)}"/><path d="M40 74Q50 102 60 74Z" fill="${flame}"/>` +
          `<path d="M34 56L18 76L34 72Z" fill="${ball('f1', [0.76, 0.14, 20])}"/><path d="M66 56L82 76L66 72Z" fill="${ball('f2', [0.76, 0.14, 20])}"/>` +
          `<path d="M50 6C66 18 70 42 68 74L32 74C30 42 34 18 50 6Z" fill="${ball('body', [0.96, 0.02, 60])}"/>` +
          `<path d="M50 6C58 12 63 19 65.5 26L34.5 26C37 19 42 12 50 6Z" fill="${ball('nose', [0.76, 0.14, 20])}"/>` +
          `<rect x="32" y="70" width="36" height="5" rx="2.5" fill="${ball('band', [0.76, 0.14, 20])}"/>` +
          shine(42, 32, 4, 7) +
          sparkles(['#fff', '#ffd36b'])
        fy = 48
        fr = 13
        break
      }
      case 'asteroid':
        hue = 290
        // A lumpy lilac rock with soft craters and a little dust trail.
        out +=
          `<circle cx="50" cy="52" r="44" fill="${glow('g', '#c3b4ff', 0.35)}"/>` +
          [
            [12, 80, 2.4],
            [20, 86, 1.6],
            [8, 70, 1.4],
          ]
            .map(
              ([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#d9ccff" opacity=".8"/>`,
            )
            .join('') +
          `<path d="M28 30C36 18 54 16 66 22C80 28 88 42 84 58C81 72 70 84 54 84C38 85 22 78 17 64C13 50 20 40 28 30Z" fill="${ball('rock', [0.8, 0.05, 290])}"/>` +
          [
            [34, 34, 5],
            [70, 66, 6],
            [68, 34, 3.4],
            [28, 66, 3.6],
          ]
            .map(
              ([x, y, r], i) =>
                `<circle cx="${x}" cy="${y}" r="${r}" fill="${ball('c' + i, [0.72, 0.05, 290])}" opacity=".85"/>`,
            )
            .join('') +
          shine(40, 30, 8, 3.5) +
          sparkles(['#fff', '#d9ccff'])
        fy = 53
        fr = 18
        break
      case 'supernova': {
        hue = 330
        // A bright burst: sixteen soft rays round a glowing core.
        const f = radial(
          'burst',
          [
            [0, '#fff7fb'],
            [0.45, '#ffb3d9'],
            [1, '#b48cff'],
          ],
          'cx=".5" cy=".5" r=".55"',
        )
        out +=
          `<circle cx="50" cy="50" r="48" fill="${glow('g', '#ff9fd0', 0.45)}"/><path d="${burst(32, 50, 50, (i) => (i % 2 ? 30 : i % 4 ? 40 : 46))}" fill="${f}" stroke="#ffc2e2" stroke-width="3" stroke-linejoin="round"/>` +
          `<circle cx="50" cy="50" r="25" fill="${ball('core', [0.94, 0.06, 340])}"/>` +
          shine(41, 40, 6, 3) +
          sparkles(['#fff', '#ffd6f0', '#c8ecff'])
        fy = 50
        fr = 17
        break
      }
      case 'satellite': {
        hue = 230
        // A rounded body with two blue solar wings and a little dish.
        const panel = (x: number) =>
          `<rect x="${x}" y="42" width="22" height="18" rx="3" fill="${ball('p' + x, [0.76, 0.11, 240])}"/>` +
          `<path d="M${n(x + 7.3)} 42V60M${n(x + 14.6)} 42V60M${x} 51H${x + 22}" stroke="#fff" stroke-width="1.2" opacity=".55"/>`
        out +=
          `<circle cx="50" cy="52" r="46" fill="${glow('g', '#7cc8ff', 0.4)}"/><path d="M28 51H72" stroke="#c8d4ff" stroke-width="3" stroke-linecap="round"/>` +
          panel(5) +
          panel(73) +
          `<path d="M50 30L50 20" stroke="#c8d4ff" stroke-width="2.4" stroke-linecap="round"/><path d="M40 16Q50 26 60 16Z" fill="${ball('dish', [0.92, 0.03, 230])}"/><circle cx="50" cy="16" r="2" fill="#ffd36b"/>` +
          `<rect x="30" y="30" width="40" height="42" rx="12" fill="${ball('body', [0.9, 0.05, 230])}"/>` +
          shine(40, 38, 6, 3) +
          sparkles(['#fff', '#a9dcff'])
        fy = 51
        fr = 15
        break
      }
      case 'pulsar': {
        hue = 220
        const orbit = linear('o', [
          [0, '#a9dcff'],
          [1, '#c8a6ff'],
        ])
        const ell = (a: number) =>
          `<ellipse cx="50" cy="50" rx="42" ry="14" transform="rotate(${a} 50 50)" fill="none" stroke="${orbit}" stroke-width="3.2" opacity=".85"/>`
        out +=
          `<circle cx="50" cy="50" r="40" fill="${glow('g', '#7cc8ff', 0.5)}"/>` +
          ell(35) +
          ell(-35) +
          `<circle cx="50" cy="50" r="22" fill="${ball('core', [0.82, 0.11, 225])}"/><circle cx="50" cy="50" r="23.5" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.4"/>` +
          shine(42, 41, 6, 3) +
          sparkles(['#fff', '#a9dcff'])
        fy = 51
        fr = 17
        break
      }
    }

    // Colour themes: the whole object (never its face) turns by a hue picked for that object.
    const themes = THEMES[object]
    const drawnTone = rng.fork('tone').int(0, themes.length - 1)
    // HTML attributes and Vue/Angular static props arrive as strings; '' means unset, not 0.
    const raw: unknown = opts.tone
    const t = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw
    const tone =
      typeof t === 'number' && Number.isInteger(t) && t >= 0 && t < themes.length ? t : drawnTone
    const turn = themes[tone]!
    // The face keeps the object's own hue, so it is the same face in every theme.
    const faceHue = hue
    if (turn) {
      out = recolor(out, turn)
      defs = recolor(defs, turn)
      hue += turn
    }
    const picks: Record<string, unknown> = {
      object,
      tone,
      hue: Math.round(((hue % 360) + 360) % 360),
    }
    if (opts.face !== false) {
      // Jolly unless asked: happy and playful only, blush always on. The face kit lifts a face by r*0.08.
      const f = face(
        rng,
        { x: fx, y: fy + fr * 0.08, r: fr, hue: faceHue },
        { mood: opts.mood, expression: opts.expression, pool: JOLLY, blush: true, ink },
      )
      out += f.svg
      picks.expression = f.expression
    }
    // The tile is a soft night sky, never a tint of the object, so the glowing pastels always stand out.
    const tile = known(SHAPES, opts.shape)
    if (tile) {
      defs +=
        `<clipPath id="${id('tile')}"><path d="${SHAPES[tile]}"/></clipPath>` +
        `<radialGradient id="${id('sky')}" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="#3a3470"/><stop offset="1" stop-color="#1c1838"/></radialGradient>`
      const dots = [
        [14, 16, 0.9],
        [84, 12, 0.7],
        [90, 58, 0.8],
        [10, 70, 0.7],
        [70, 90, 0.6],
        [30, 92, 0.8],
      ]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".7"/>`)
        .join('')
      out = `<g clip-path="url(#${id('tile')})"><rect width="100" height="100" fill="url(#${id('sky')})"/>${dots}${out}</g>`
      picks.shape = tile
    }
    return { defs, body: out, picks }
  },
}
