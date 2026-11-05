import type {
  AuraOptions,
  ClayOptions,
  GroupMember,
  InitialsOptions,
  Style,
} from '@inlaylab/opaline'

export type AvatarProps = {
  seed: string | number | null | undefined
  /** The style object, e.g. `morph` from `@inlaylab/opaline/morph`. */
  look: Style<any>
  size?: number
  /** Photo to show over the generated avatar once it loads. */
  src?: string
  /** Accessible name. Without it the avatar is decorative and hidden from assistive tech. */
  alt?: string
} & ClayOptions &
  AuraOptions &
  InitialsOptions

export type AvatarGroupProps = Omit<AvatarProps, 'seed' | 'src' | 'alt'> & {
  /** Seeds, or `{ seed, src, alt }` for a photo and an accessible name. */
  members: readonly GroupMember[]
  /** Show at most this many avatars, then a `+N` chip. Shows everyone when unset. */
  max?: number
  /** Accessible name for the whole group, e.g. "Project members". */
  alt?: string
}
