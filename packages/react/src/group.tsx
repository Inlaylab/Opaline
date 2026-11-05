import { avatarGroup, type GroupMember } from '@inlaylab/opaline'
import type { CSSProperties, JSX } from 'react'
import { Avatar, type AvatarProps } from './avatar.tsx'

export type AvatarGroupProps = Omit<AvatarProps, 'seed' | 'src' | 'alt'> & {
  /** Seeds, or `{ seed, src, alt }` for a photo and an accessible name. */
  members: readonly GroupMember[]
  /** Show at most this many avatars, then a `+N` chip. Shows everyone when unset. */
  max?: number
  /** Accessible name for the whole group, e.g. "Project members". */
  alt?: string
}

/** `a:b;c-d:e` to a React style object; custom properties keep their name. */
const css = (text: string): CSSProperties =>
  Object.fromEntries(
    text.split(';').map((rule) => {
      const i = rule.indexOf(':')
      const key = rule.slice(0, i)
      return [
        key.startsWith('--') ? key : key.replace(/-(\w)/g, (_, c) => c.toUpperCase()),
        rule.slice(i + 1),
      ]
    }),
  )

/** Overlapping avatars with a `+N` chip. Server-safe, like `<Avatar>`. */
export function AvatarGroup({
  members,
  max,
  alt,
  size = 40,
  ...options
}: AvatarGroupProps): JSX.Element {
  const g = avatarGroup(members, { max, size, shape: options.shape })
  return (
    <span data-opaline-group="" role="group" aria-label={alt || undefined} style={css(g.css.root)}>
      {g.shown.map((m, i) => (
        <span key={i} data-opaline-member="" style={css(i ? g.css.member : g.css.first)}>
          <Avatar {...options} size={size} seed={m.seed} src={m.src} alt={m.alt} />
        </span>
      ))}
      {g.rest ? (
        <span data-opaline-more="" role="img" aria-label={`${g.rest} more`} style={css(g.css.more)}>
          {`+${g.rest}`}
        </span>
      ) : null}
    </span>
  )
}
