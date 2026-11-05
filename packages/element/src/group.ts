import { avatarGroup, type Shape } from '@inlaylab/opaline'

/** Group attributes that set a default on every child avatar that does not set its own. */
const SHARED = ['look', 'size', 'palette', 'shape', 'finish'] as const

/**
 * `<opaline-avatar-group max="3" look="clay">` around `<opaline-avatar>` children: overlaps them,
 * shows at most `max`, then a `+N` chip. Children added or removed later are laid out again.
 */
export class OpalineAvatarGroup extends HTMLElement {
  static observedAttributes: readonly string[] = ['max', 'alt', ...SHARED]
  readonly #observer = new MutationObserver(() => this.#layout())
  // The attributes this group set on each child, so it can update or take them back later.
  readonly #given = new WeakMap<Element, Set<string>>()
  #more?: HTMLSpanElement

  connectedCallback(): void {
    this.#layout()
    this.#observer.observe(this, { childList: true })
  }

  disconnectedCallback(): void {
    this.#observer.disconnect()
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#layout()
  }

  #layout(): void {
    const get = (name: string) => this.getAttribute(name)
    const n = Number(get('size'))
    const size = Number.isFinite(n) && n > 0 ? n : 40
    const kids = [...this.children].filter(
      (e): e is HTMLElement => e.localName === 'opaline-avatar',
    )
    const g = avatarGroup(
      kids.map(() => 0),
      { max: Number(get('max') ?? NaN), size, shape: (get('shape') ?? undefined) as Shape },
    )
    kids.forEach((kid, i) => {
      let given = this.#given.get(kid)
      if (!given) this.#given.set(kid, (given = new Set()))
      for (const name of SHARED) {
        if (kid.hasAttribute(name) && !given.has(name)) continue
        const v = name === 'size' ? String(size) : get(name)
        if (v === null) {
          if (given.delete(name)) kid.removeAttribute(name)
        } else if (kid.getAttribute(name) !== v) {
          kid.setAttribute(name, v)
          given.add(name)
        } else given.add(name)
      }
      // Past `max`, a child stays in the DOM but out of sight and out of the group.
      kid.toggleAttribute('data-opaline-member', i < g.shown.length)
      kid.style.cssText = i >= g.shown.length ? 'display:none' : i ? g.css.member : g.css.first
    })
    this.setAttribute('data-opaline-group', '')
    this.setAttribute('role', 'group')
    const alt = get('alt')
    if (alt) this.setAttribute('aria-label', alt)
    else this.removeAttribute('aria-label')
    this.style.cssText = g.css.root
    if (g.rest) {
      const more = (this.#more ??= document.createElement('span'))
      more.setAttribute('data-opaline-more', '')
      more.setAttribute('role', 'img')
      more.setAttribute('aria-label', `${g.rest} more`)
      more.style.cssText = g.css.more
      more.textContent = `+${g.rest}`
      if (this.lastElementChild !== more) this.append(more)
    } else this.#more?.remove()
    // Our own changes to the children are not news.
    this.#observer.takeRecords()
  }
}

if (!customElements.get('opaline-avatar-group'))
  customElements.define('opaline-avatar-group', OpalineAvatarGroup)

declare global {
  interface HTMLElementTagNameMap {
    'opaline-avatar-group': OpalineAvatarGroup
  }
}
