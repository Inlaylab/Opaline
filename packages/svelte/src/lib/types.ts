import type { AuraOptions, ClayOptions, InitialsOptions, Style } from '@inlaylab/opaline'

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
