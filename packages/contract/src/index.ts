import {
  createAvatar,
  type AuraOptions,
  type ClayOptions,
  type GroupMember,
  type InitialsOptions,
  type PipOptions,
  type PlushOptions,
  type Shape,
  type Style,
} from '@inlaylab/opaline'
import { aura } from '@inlaylab/opaline/aura'
import { clay } from '@inlaylab/opaline/clay'
import { gradient } from '@inlaylab/opaline/gradient'
import { initials } from '@inlaylab/opaline/initials'
import { morph } from '@inlaylab/opaline/morph'
import { pip } from '@inlaylab/opaline/pip'
import { plush } from '@inlaylab/opaline/plush'
import { afterEach, expect, test } from 'vitest'

/** The props every wrapper accepts. `look` is a name here; each adapter maps it to its own input. */
export type Props = {
  seed: string
  size?: number
  src?: string
  alt?: string
  look?: 'morph' | 'gradient' | 'aura' | 'clay' | 'initials' | 'plush' | 'pip'
} & ClayOptions &
  AuraOptions &
  InitialsOptions &
  PlushOptions &
  PipOptions

export type Adapter = {
  name: string
  /** Mounts the component and resolves with its root `[data-opaline]` element. */
  render(props: Props): Promise<HTMLElement>
  /** Applies new props and resolves with the (possibly new) root element. */
  update(root: HTMLElement, props: Props): Promise<HTMLElement>
  /** Server markup, then hydrates it in the page; rejects on a hydration mismatch. */
  ssr?(props: Props): Promise<{ html: string; hydrate(): Promise<HTMLElement> }>
  cleanup?(): void
}

export const STYLES: Record<NonNullable<Props['look']>, Style<any>> = {
  morph,
  gradient,
  aura,
  clay,
  initials,
  plush,
  pip,
}

// A real 1×1 PNG, and bytes that are not an image, so no test needs the network.
export const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
export const BROKEN = 'data:image/png;base64,AAAA'

/** Core SVG for these props, as the browser would serialize it, with instance suffixes removed. */
export function expectedSvg(props: Props): string {
  const { src, alt, look = 'morph', ...options } = props
  ;(void src, alt)
  return serialize(createAvatar(STYLES[look], options).svg)
}

const serialize = (svg: string) => {
  const t = document.createElement('template')
  t.innerHTML = svg
  return stripInstance(t.innerHTML)
}
const stripInstance = (svg: string) => svg.replace(/(a[0-9a-z]{7}-[a-z0-9]+)-[\w-]+/g, '$1')
const svgOf = (root: HTMLElement) => root.querySelector('svg')!
const imgOf = (root: HTMLElement) => root.querySelector('img')
const gradientIds = (root: HTMLElement) => [...root.querySelectorAll('[id]')].map((e) => e.id)
const until = async (check: () => boolean, ms = 2000) => {
  const end = Date.now() + ms
  while (!check()) {
    if (Date.now() > end) throw new Error('condition not met in time')
    await new Promise((r) => requestAnimationFrame(r))
  }
}

/** The behavior every Opaline wrapper must share. */
export function runContract(adapter: Adapter): void {
  afterEach(() => {
    adapter.cleanup?.()
    document.body.innerHTML = ''
  })

  test(`${adapter.name}: markup parity with the core`, async () => {
    for (const look of ['morph', 'gradient', 'aura'] as const) {
      const props: Props = { seed: 'ada@inlay.dev', look, size: 48 }
      const root = await adapter.render(props)
      expect(stripInstance(svgOf(root).outerHTML)).toBe(expectedSvg(props))
      expect(root.style.width).toBe('48px')
      expect(root.style.height).toBe('48px')
    }
  })

  test(`${adapter.name}: every option reaches the core`, async () => {
    const props: Props = {
      seed: 'b',
      look: 'morph',
      expression: 'wink',
      backdrop: 'tint',
      family: 'petal',
      palette: 'cool',
      face: true,
    }
    const root = await adapter.render(props)
    expect(stripInstance(svgOf(root).outerHTML)).toBe(expectedSvg(props))
  })

  test(`${adapter.name}: alt names the avatar, no alt hides it`, async () => {
    const named = await adapter.render({ seed: 'a', alt: 'Ada Lovelace' })
    expect(named.getAttribute('role')).toBe('img')
    expect(named.getAttribute('aria-label')).toBe('Ada Lovelace')
    expect(named.hasAttribute('aria-hidden')).toBe(false)
    const plain = await adapter.render({ seed: 'b' })
    expect(plain.getAttribute('aria-hidden')).toBe('true')
    expect(plain.hasAttribute('role')).toBe(false)
  })

  test(`${adapter.name}: the root carries no input attributes`, async () => {
    // The seed is often an email; it must not leak into page markup through the root.
    const props: Props = {
      seed: 'ada@inlay.dev',
      alt: 'Ada',
      src: PIXEL,
      look: 'gradient',
      size: 48,
      palette: 'cool',
    }
    const root = await adapter.render(props)
    expect(root.hasAttribute('seed')).toBe(false)
    expect(root.hasAttribute('alt')).toBe(false)
    for (const name of Object.keys(props)) expect(root.hasAttribute(name)).toBe(false)
  })

  for (const look of ['gradient', 'clay'] as const)
    test(`${adapter.name}: instance ids differ for the same ${look} avatar`, async () => {
      const a = await adapter.render({ seed: 'same', look })
      const b = await adapter.render({ seed: 'same', look })
      const ids = [...gradientIds(a), ...gradientIds(b)]
      expect(ids.length).toBeGreaterThan(0)
      expect(new Set(ids).size).toBe(ids.length)
      expect(stripInstance(svgOf(a).outerHTML)).toBe(stripInstance(svgOf(b).outerHTML))
    })

  test(`${adapter.name}: clay options reach the core`, async () => {
    const props: Props = {
      seed: 'b',
      look: 'clay',
      body: 'hood',
      ears: 'bunny',
      finish: 'gloss',
      expression: 'wink',
    }
    const root = await adapter.render(props)
    expect(stripInstance(svgOf(root).outerHTML)).toBe(expectedSvg(props))
  })

  test(`${adapter.name}: plush and pip options reach the core`, async () => {
    for (const props of [
      { seed: 'b', look: 'plush', accessory: 'beret', expression: 'wink' },
      { seed: 'b', look: 'plush', accessory: 'glasses', palette: 'pastel', shape: 'squircle' },
      { seed: 'b', look: 'pip', form: 'heart', finish: 'gloss' },
      { seed: 'c', look: 'pip', form: 'drop', face: false, backdrop: 'tint' },
    ] as Props[]) {
      const root = await adapter.render(props)
      expect(stripInstance(svgOf(root).outerHTML)).toBe(expectedSvg(props))
    }
  })

  test(`${adapter.name}: initials with shape and text reach the core`, async () => {
    for (const props of [
      { seed: 'ada.lovelace@inlay.dev', look: 'initials', shape: 'square' },
      { seed: 'b', look: 'initials', shape: 'squircle', text: 'Op', palette: 'pastel' },
    ] as Props[]) {
      const root = await adapter.render(props)
      expect(stripInstance(svgOf(root).outerHTML)).toBe(expectedSvg(props))
    }
  })

  test(`${adapter.name}: shape reaches the core on every style`, async () => {
    for (const look of ['morph', 'clay', 'aura'] as const) {
      const props: Props = { seed: 'b', look, shape: 'squircle' }
      const root = await adapter.render(props)
      expect(stripInstance(svgOf(root).outerHTML)).toBe(expectedSvg(props))
    }
  })

  test(`${adapter.name}: a failed src keeps the svg`, async () => {
    const root = await adapter.render({ seed: 'a', src: BROKEN, alt: 'A' })
    await new Promise((r) => setTimeout(r, 300))
    expect(svgOf(root)).toBeTruthy()
    expect(imgOf(root)?.hidden ?? true).toBe(true)
  })

  test(`${adapter.name}: a loaded image shows`, async () => {
    const root = await adapter.render({ seed: 'a', src: PIXEL })
    await until(() => imgOf(root)?.hidden === false)
    expect(imgOf(root)!.getAttribute('alt')).toBe('')
    expect(svgOf(root)).toBeTruthy()
  })

  test(`${adapter.name}: src change resets the photo`, async () => {
    let root = await adapter.render({ seed: 'a', src: BROKEN })
    await new Promise((r) => setTimeout(r, 300))
    root = await adapter.update(root, { seed: 'a', src: PIXEL })
    await until(() => imgOf(root)?.hidden === false)
  })

  test(`${adapter.name}: updates on change`, async () => {
    let root = await adapter.render({ seed: 'one' })
    const before = stripInstance(svgOf(root).outerHTML)
    root = await adapter.update(root, { seed: 'two' })
    expect(stripInstance(svgOf(root).outerHTML)).not.toBe(before)
    expect(stripInstance(svgOf(root).outerHTML)).toBe(expectedSvg({ seed: 'two' }))
    root = await adapter.update(root, { seed: 'two', src: PIXEL })
    await until(() => imgOf(root)?.hidden === false)
  })

  if (adapter.ssr) {
    const ssr = adapter.ssr
    test(`${adapter.name}: server markup hydrates without changes`, async () => {
      const { html, hydrate } = await ssr({
        seed: 'ada@inlay.dev',
        look: 'gradient',
        src: PIXEL,
        alt: 'Ada',
      })
      expect(html).toContain('<svg')
      expect(html).toMatch(/<img[^>]*hidden/)
      const root = await hydrate()
      expect(root.getAttribute('aria-label')).toBe('Ada')
      await until(() => imgOf(root)?.hidden === false)
    })
  }
}

/** The props every avatar group accepts. Members are seeds or `{ seed, src, alt }`. */
export type GroupProps = {
  members: GroupMember[]
  max?: number
  size?: number
  alt?: string
  look?: NonNullable<Props['look']>
  shape?: Shape
  palette?: Props['palette']
}

export type GroupAdapter = {
  name: string
  /** Mounts the group and resolves with its root `[data-opaline-group]` element. */
  render(props: GroupProps): Promise<HTMLElement>
  cleanup?(): void
}

const membersOf = (root: HTMLElement) => [
  ...root.querySelectorAll<HTMLElement>('[data-opaline-member]'),
]
const moreOf = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-opaline-more]')

/** The behavior every Opaline avatar group must share. */
export function runGroupContract(adapter: GroupAdapter): void {
  afterEach(() => {
    adapter.cleanup?.()
    document.body.innerHTML = ''
  })

  const people: GroupMember[] = ['ada', 'grace', 'linus', 'margaret', 'alan']

  test(`${adapter.name} group: shows max avatars, then a +N chip`, async () => {
    const root = await adapter.render({ members: people, max: 3, size: 40, look: 'clay' })
    const members = membersOf(root)
    expect(members).toHaveLength(3)
    members.forEach((m, i) =>
      expect(stripInstance(svgOf(m).outerHTML)).toBe(
        expectedSvg({ seed: people[i] as string, look: 'clay', size: 40 }),
      ),
    )
    const more = moreOf(root)!
    expect(more.textContent!.trim()).toBe('+2')
    expect(more.getAttribute('role')).toBe('img')
    expect(more.getAttribute('aria-label')).toBe('2 more')
    expect(more.getBoundingClientRect().width).toBeCloseTo(40, 0)
  })

  test(`${adapter.name} group: everyone and no chip without max`, async () => {
    const root = await adapter.render({ members: people })
    expect(membersOf(root)).toHaveLength(5)
    expect(moreOf(root)).toBeNull()
  })

  test(`${adapter.name} group: alt names the group`, async () => {
    const root = await adapter.render({ members: people, alt: 'Project members' })
    expect(root.getAttribute('role')).toBe('group')
    expect(root.getAttribute('aria-label')).toBe('Project members')
  })

  test(`${adapter.name} group: member photos and names reach each avatar`, async () => {
    const root = await adapter.render({
      members: [{ seed: 'ada', src: PIXEL, alt: 'Ada Lovelace' }, 'grace'],
    })
    const [first, second] = membersOf(root).map((m) =>
      m.querySelector<HTMLElement>('[data-opaline]')!,
    )
    expect(first!.getAttribute('aria-label')).toBe('Ada Lovelace')
    await until(() => imgOf(first!)?.hidden === false)
    expect(second!.getAttribute('aria-hidden')).toBe('true')
    expect(imgOf(second!)).toBeNull()
  })

  test(`${adapter.name} group: avatars overlap and options reach the core`, async () => {
    const root = await adapter.render({
      members: ['same', 'same'],
      size: 48,
      look: 'initials',
      shape: 'squircle',
      palette: 'pastel',
    })
    const [a, b] = membersOf(root)
    expect(getComputedStyle(a!).marginLeft).toBe('0px')
    expect(getComputedStyle(b!).marginLeft).toBe('-12px')
    expect(getComputedStyle(b!).borderRadius).toBe('38%')
    const expected = expectedSvg({
      seed: 'same',
      look: 'initials',
      shape: 'squircle',
      palette: 'pastel',
      size: 48,
    })
    expect(stripInstance(svgOf(a!).outerHTML)).toBe(expected)
    // The same seed twice still gets its own gradient IDs.
    const ids = gradientIds(root)
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })
}
