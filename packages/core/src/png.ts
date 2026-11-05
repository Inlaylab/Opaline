/// <reference lib="dom" />

export type RasterOptions = {
  /** Output width and height in pixels. Defaults to the avatar's own `size`. */
  size?: number
  /** Theme colors to bake in, e.g. `{ '--avatar-c1': '#7c3aed' }`. Others keep their fallback. */
  vars?: Record<string, string>
}

// A color value we are willing to place in an attribute: hex, names and color functions.
const SAFE_COLOR = /^[#\w\s(),.%/-]+$/

/**
 * The SVG made ready for a rasterizer: CSS variables replaced by `vars` or their fallback hex (an
 * image has no page to inherit them from, and resvg ignores them), and the root sized to `size`.
 * Works anywhere; use it with resvg or sharp on the server.
 */
export function forRaster(avatar: string | { svg: string }, options: RasterOptions = {}): string {
  const vars = options.vars ?? {}
  let svg = (typeof avatar === 'string' ? avatar : avatar.svg).replace(
    /var\((--[\w-]+),\s*(#[0-9a-fA-F]{3,8})\)/g,
    (_, name: string, hex: string) => {
      const v = Object.hasOwn(vars, name) ? String(vars[name]).trim() : ''
      return v && SAFE_COLOR.test(v) ? v : hex
    },
  )
  if (options.size !== undefined) {
    const { size } = options
    if (!(Number.isFinite(size) && size > 0))
      throw new RangeError('size must be a positive finite number')
    // Only the root <svg>: nested elements never carry width or height in Opaline output.
    svg = svg.replace(
      /^<svg([^>]*?) width="[^"]*" height="[^"]*"/,
      `<svg$1 width="${size}" height="${size}"`,
    )
  }
  return svg
}

/**
 * A PNG of the avatar, rendered by the browser. Browser only: on the server, pass `forRaster(svg)`
 * to a rasterizer such as `@resvg/resvg-js`.
 *
 * ```ts
 * const png = await toPng(createAvatar(clay, { seed }), { size: 512 })
 * ```
 */
export async function toPng(
  avatar: string | { svg: string },
  options: RasterOptions = {},
): Promise<Blob> {
  if (typeof Image !== 'function')
    throw new Error('toPng needs a browser. On the server, render forRaster(svg) with resvg.')
  const svg = forRaster(avatar, options)
  const px = Math.round(Number(/^<svg[^>]* width="([\d.]+)"/.exec(svg)?.[1]) || 64)
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const img = new Image(px, px)
    img.src = url
    await img.decode()
    if (typeof OffscreenCanvas === 'function') {
      const canvas = new OffscreenCanvas(px, px)
      canvas.getContext('2d')!.drawImage(img, 0, 0, px, px)
      return await canvas.convertToBlob({ type: 'image/png' })
    }
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = px
    canvas.getContext('2d')!.drawImage(img, 0, 0, px, px)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))),
        'image/png',
      ),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}
