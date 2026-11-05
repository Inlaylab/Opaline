export type Oklch = { l: number; c: number; h: number }

type Rgb = [number, number, number]

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const fromLinear = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

// OKLab matrices from Björn Ottosson, https://bottosson.github.io/posts/oklab/
function oklchToLinear({ l: L, c, h }: Oklch): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4)

export function hexToOklch(hex: string): Oklch {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.replace(/./g, '$&$&')
  const [r, g, b] = [0, 2, 4].map((i) => toLinear(parseInt(h.slice(i, i + 2), 16) / 255)) as Rgb
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    c: Math.hypot(A, B),
    h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360,
  }
}

/** Out-of-gamut colors keep lightness and hue; chroma drops until they fit sRGB. */
export function oklchToHex(color: Oklch): string {
  let rgb = oklchToLinear(color)
  if (!inGamut(rgb)) {
    let lo = 0
    let hi = color.c
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2
      if (inGamut(oklchToLinear({ ...color, c: mid }))) lo = mid
      else hi = mid
    }
    rgb = oklchToLinear({ ...color, c: lo })
  }
  return (
    '#' +
    rgb
      .map((v) =>
        Math.round(Math.min(1, Math.max(0, fromLinear(v))) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}

export function adjust(hex: string, d: { l?: number; c?: number; h?: number }): string {
  const o = hexToOklch(hex)
  return oklchToHex({
    l: Math.min(1, Math.max(0, o.l + (d.l ?? 0))),
    c: Math.max(0, o.c + (d.c ?? 0)),
    h: o.h + (d.h ?? 0),
  })
}

/** WCAG 2 relative luminance of a hex color. */
function luminance(hex: string): number {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.replace(/./g, '$&$&')
  const [r, g, b] = [0, 2, 4].map((i) => toLinear(parseInt(h.slice(i, i + 2), 16) / 255)) as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2 contrast ratio between two hex colors, from 1 (none) to 21 (black on white). */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

export function cssVar(index: number, hex: string): string {
  return `var(--avatar-c${index}, ${hex})`
}

/** For renderers without CSS variables (resvg): keep each fallback hex. */
export function resolveVars(svg: string): string {
  return svg.replace(/var\(--[\w-]+,\s*(#[0-9a-fA-F]{3,8})\)/g, '$1')
}
