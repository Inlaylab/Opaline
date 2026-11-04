import { el } from '../svg.ts'

/** The outline of an avatar's tile. */
export type Shape = 'circle' | 'squircle' | 'square' | 'ellipse'

const oval = (rx: number) => `M50 0A${rx} 50 0 1 1 50 100A${rx} 50 0 1 1 50 0Z`

/**
 * Each shape's path in the 100×100 viewBox; also the lookup for `known()`. Circle and squircle are
 * the exact 1.0 Aura paths: frozen output depends on these strings.
 */
export const SHAPES: Record<Shape, string> = {
  circle: oval(50),
  squircle: 'M50 0C88 0 100 12 100 50S88 100 50 100 0 88 0 50 12 0 50 0Z',
  square: 'M0 0H100V100H0Z',
  // A tall cameo oval, 80 wide and 100 high.
  ellipse: oval(40),
}

/** Path data for a shape in the 100×100 viewBox. */
export const tile = (shape: Shape): string => SHAPES[shape]

const RIM = { fill: 'none', stroke: '#fff', 'stroke-opacity': 0.28, 'stroke-width': 1.6 }

/** The faint white rim on round tiles; cornered tiles have none. */
export function rim(shape: Shape): string {
  if (shape === 'circle') return el('circle', { cx: 50, cy: 50, r: 48.6, ...RIM })
  if (shape === 'ellipse') return el('ellipse', { cx: 50, cy: 50, rx: 38.6, ry: 48.6, ...RIM })
  return ''
}

/** The tint backdrop behind a character. Unset or circle is the 1.0 `<circle>`, byte for byte. */
export function backdrop(shape: Shape | undefined, fill: string): string {
  return !shape || shape === 'circle'
    ? el('circle', { cx: 50, cy: 50, r: 50, fill })
    : el('path', { d: tile(shape), fill })
}
