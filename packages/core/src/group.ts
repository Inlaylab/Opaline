import type { Shape } from './parts/tile.ts'

/** One person in an avatar group: a seed, or a seed with a photo and an accessible name. */
export type GroupMember =
  string | number | { seed: string | number | null | undefined; src?: string; alt?: string }

export type GroupLayout = {
  /** The avatars to draw, in order. */
  shown: { seed: string | number | null | undefined; src?: string; alt?: string }[]
  /** How many people the `+N` chip stands for. 0 means no chip. */
  rest: number
  /** How far each avatar tucks under the one before it, in pixels. */
  overlap: number
  /** CSS `border-radius` for the ring around each avatar, matching its tile. */
  radius: string
  /** Font size of the `+N` chip, in pixels. */
  font: number
  /** Inline CSS for the root, each avatar after the first, the first avatar and the `+N` chip. */
  css: { root: string; first: string; member: string; more: string }
}

const RADIUS: Record<Shape, string> = { circle: '50%', squircle: '38%', square: '0' }
const RING = 'var(--avatar-ring, #fff)'

/**
 * What an avatar group shows: at most `max` avatars, then a `+N` chip for the rest. Wrappers share
 * it so every framework lays a group out the same way. A missing or invalid `max` shows everyone.
 */
export function avatarGroup(
  members: readonly GroupMember[],
  { max, size = 40, shape }: { max?: number; size?: number; shape?: Shape } = {},
): GroupLayout {
  const all = members.map((m) => (m !== null && typeof m === 'object' ? m : { seed: m }))
  const limit = Number.isFinite(max) && max! >= 1 ? Math.floor(max!) : all.length
  const shown = all.slice(0, limit)
  const overlap = Math.round(size * 0.25)
  const radius = (shape && RADIUS[shape]) || '50%'
  const font = Math.round(size * 0.36)
  // The ring color also fills behind each avatar, so a transparent one never shows its neighbor.
  const first = `display:inline-flex;border-radius:${radius};background:${RING};box-shadow:0 0 0 2px ${RING}`
  const member = `${first};margin-left:-${overlap}px`
  return {
    shown,
    rest: all.length - shown.length,
    overlap,
    radius,
    font,
    css: {
      root: 'display:inline-flex;align-items:center',
      first,
      member,
      more:
        `${member};width:${size}px;height:${size}px;align-items:center;justify-content:center;` +
        `font:600 ${font}px/1 system-ui,sans-serif;color:var(--avatar-more-fg, #4a4560);` +
        `background:var(--avatar-more-bg, #ece9f5)`,
    },
  }
}
