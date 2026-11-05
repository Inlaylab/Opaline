import { createAvatar, escapeXml, type Style } from '@inlaylab/opaline'
import { aura } from '@inlaylab/opaline/aura'
import { clay } from '@inlaylab/opaline/clay'
import { gradient } from '@inlaylab/opaline/gradient'
import { initials } from '@inlaylab/opaline/initials'
import { morph } from '@inlaylab/opaline/morph'

export { OpalineAvatarGroup } from './group.ts'

const LOOKS: Record<string, Style<any>> = { morph, gradient, aura, clay, initials }
const ATTRS = [
  'seed',
  'look',
  'size',
  'src',
  'alt',
  'palette',
  'family',
  'face',
  'mood',
  'expression',
  'backdrop',
  'shape',
  'finish',
  'body',
  'ears',
  'text',
] as const
const IMG_STYLE =
  'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit'
let count = 0

/** `<opaline-avatar seed="ada@inlay.dev" look="morph">`: a seeded avatar with an optional photo. */
export class OpalineAvatar extends HTMLElement {
  static observedAttributes: readonly string[] = ATTRS
  // Unique per element, so the same avatar twice on a page never shares gradient IDs.
  readonly #instance = `e${++count}`

  #connected = false

  connectedCallback(): void {
    this.#connected = true
    this.#render()
  }

  disconnectedCallback(): void {
    this.#connected = false
  }

  attributeChangedCallback(): void {
    // On upgrade every existing attribute fires first; connectedCallback renders once after them.
    if (this.#connected) this.#render()
  }

  #render(): void {
    const get = (name: string) => this.getAttribute(name) ?? undefined
    // An HTML attribute typo should not throw; fall back to the default size.
    const n = Number(get('size'))
    const size = Number.isFinite(n) && n > 0 ? n : 64
    const alt = get('alt')
    const src = get('src')
    const svg = createAvatar(
      Object.hasOwn(LOOKS, get('look') ?? '') ? LOOKS[get('look')!]! : morph,
      {
        seed: get('seed'),
        size,
        instance: this.#instance,
        palette: get('palette'),
        family: get('family'),
        face: get('face') === 'false' ? false : get('face') === 'true' ? true : undefined,
        mood: get('mood'),
        expression: get('expression'),
        backdrop: get('backdrop'),
        shape: get('shape'),
        finish: get('finish'),
        body: get('body'),
        ears: get('ears'),
        text: get('text'),
      } as never,
    ).svg
    const a11y = alt ? `role="img" aria-label="${escapeXml(alt)}"` : 'aria-hidden="true"'
    const img = src ? `<img src="${escapeXml(src)}" alt="" style="${IMG_STYLE}" hidden>` : ''
    this.innerHTML = `<span data-opaline="" style="display:inline-block;width:${size}px;height:${size}px;position:relative" ${a11y}>${svg}${img}</span>`
    const el = this.querySelector('img')
    if (!el) return
    el.onload = () => (el.hidden = false)
    el.onerror = () => el.remove()
    // A cached image may finish before the handlers attach.
    if (el.complete && el.naturalWidth > 0) el.hidden = false
  }
}

if (!customElements.get('opaline-avatar')) customElements.define('opaline-avatar', OpalineAvatar)

declare global {
  interface HTMLElementTagNameMap {
    'opaline-avatar': OpalineAvatar
  }
}
