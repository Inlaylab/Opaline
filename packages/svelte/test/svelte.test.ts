import { expectedSvg, runContract, type Props } from '@inlaylab/opaline-contract'
import { morph } from '@inlaylab/opaline/morph'
import { flushSync, hydrate, mount, unmount } from 'svelte'
import { commands } from 'vitest/browser'
import { expect, test } from 'vitest'
import Avatar from '../src/lib/Avatar.svelte'
import Harness from './Harness.svelte'

declare module 'vitest/browser' {
  interface BrowserCommands {
    ssrRender(props: Props): Promise<string>
  }
}

type Instance = { state: { props: Props } }
const instances = new Map<HTMLElement, Instance>()
const rootOf = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-opaline]')!
const stripInstance = (svg: string) => svg.replace(/(a[0-9a-z]{7}-[a-z0-9]+)-[\w-]+/g, '$1')

/** Svelte reports a hydration mismatch as a console warning, so catch it there. */
function catchHydration<T>(run: () => T): T {
  const messages: string[] = []
  const warn = console.warn
  const error = console.error
  console.warn = (...args) => (messages.push(args.join(' ')), warn(...args))
  console.error = (...args) => (messages.push(args.join(' ')), error(...args))
  try {
    const result = run()
    const mismatch = messages.find((m) => /hydrat/i.test(m))
    if (mismatch) throw new Error(`hydration mismatch: ${mismatch}`)
    return result
  } finally {
    console.warn = warn
    console.error = error
  }
}

const container = () => {
  const el = document.createElement('div')
  document.body.append(el)
  return el
}

runContract({
  name: 'svelte',
  async render(props) {
    const target = container()
    instances.set(target, mount(Harness, { target, props: { initial: props } }) as Instance)
    flushSync()
    return rootOf(target)
  },
  async update(el, props) {
    const target = el.parentElement!
    instances.get(target)!.state.props = props
    flushSync()
    return rootOf(target)
  },
  async ssr(props) {
    const html = await commands.ssrRender(props)
    return {
      html,
      async hydrate() {
        const target = container()
        target.innerHTML = html
        return catchHydration(() => {
          instances.set(target, hydrate(Harness, { target, props: { initial: props } }) as Instance)
          flushSync()
          return rootOf(target)
        })
      },
    }
  },
  cleanup() {
    for (const instance of instances.values()) unmount(instance)
    instances.clear()
  },
})

test('svelte: a missing seed renders as the empty seed', () => {
  const target = container()
  const app = mount(Avatar, { target, props: { look: morph, seed: undefined } })
  flushSync()
  expect(stripInstance(target.querySelector('svg')!.outerHTML)).toBe(expectedSvg({ seed: '' }))
  unmount(app)
})
