import { createAvatar, type AuraOptions, type BlobOptions, type Style } from '@inlaylab/opaline'
import { useId, type JSX } from 'react'
import { Photo } from './photo.tsx'

export type AvatarProps = {
  seed: string | number | null | undefined
  /** The style object, e.g. `morph` from `@inlaylab/opaline/morph`. */
  look: Style<any>
  size?: number
  /** Photo to show over the generated avatar once it loads. */
  src?: string
  /** Accessible name. Without it the avatar is decorative and hidden from assistive tech. */
  alt?: string
} & BlobOptions &
  AuraOptions

/** Server-safe: without `src` it renders no client code at all. */
export function Avatar({ look, size = 64, src, alt, ...options }: AvatarProps): JSX.Element {
  // useId matches on server and client, so hydration keeps the same gradient IDs.
  const instance = useId()
  const svg = createAvatar(look, { ...options, size, instance }).svg
  return (
    <span
      data-opaline=""
      style={{ display: 'inline-block', width: size, height: size, position: 'relative' }}
      {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}
    >
      {/* Safe: the core escapes every input that reaches the SVG. */}
      <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: svg }} />
      {src ? <Photo key={src} src={src} /> : null}
    </span>
  )
}
