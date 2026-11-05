import {
  expectedSvg,
  runContract,
  runGroupContract,
  STYLES,
  type GroupProps,
  type Props,
} from '@inlaylab/opaline-contract'
import { morph } from '@inlaylab/opaline/morph'
import { renderToString } from 'vue/server-renderer'
import { expect, test } from 'vitest'
import { createApp, createSSRApp, h, nextTick, reactive, type App } from 'vue'
import { Avatar, AvatarGroup } from '../src/index.ts'

let appCount = 0
// Each render is its own app, so give each one an id prefix, as a page with several Vue apps must.
const prefixed = (app: App) => ((app.config.idPrefix = `app${++appCount}`), app)
const apps = new Map<HTMLElement, { app: App; state: Props }>()
const rootOf = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-opaline]')!
const component = (state: Props) => ({
  render: () => {
    const { look = 'morph', ...props } = state
    return h(Avatar, { look: STYLES[look], ...props })
  },
})

/** Vue reports a hydration mismatch as a console warning, so catch it there. */
async function catchHydration<T>(run: () => Promise<T>): Promise<T> {
  const messages: string[] = []
  const warn = console.warn
  const error = console.error
  console.warn = (...args) => (messages.push(args.join(' ')), warn(...args))
  console.error = (...args) => (messages.push(args.join(' ')), error(...args))
  try {
    const result = await run()
    const mismatch = messages.find((m) => /hydration/i.test(m))
    if (mismatch) throw new Error(`hydration mismatch: ${mismatch}`)
    return result
  } finally {
    console.warn = warn
    console.error = error
  }
}

runContract({
  name: 'vue',
  async render(props) {
    const container = document.createElement('div')
    document.body.append(container)
    const state = reactive({ ...props }) as Props
    const app = prefixed(createApp(component(state)))
    app.mount(container)
    apps.set(container, { app, state })
    await nextTick()
    return rootOf(container)
  },
  async update(el, props) {
    const container = el.parentElement!
    const { state } = apps.get(container)!
    for (const key of Object.keys(state)) delete (state as Record<string, unknown>)[key]
    Object.assign(state, props)
    await nextTick()
    return rootOf(container)
  },
  async ssr(props) {
    const html = await renderToString(createSSRApp(component({ ...props })))
    return {
      html,
      hydrate: () =>
        catchHydration(async () => {
          const container = document.createElement('div')
          container.innerHTML = html
          document.body.append(container)
          const state = reactive({ ...props }) as Props
          const app = createSSRApp(component(state))
          app.mount(container)
          apps.set(container, { app, state })
          await nextTick()
          return rootOf(container)
        }),
    }
  },
  cleanup() {
    for (const { app } of apps.values()) app.unmount()
    apps.clear()
  },
})

test('vue: a missing seed renders as the empty seed', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  const app = createApp({ render: () => h(Avatar, { look: morph, seed: undefined }) })
  app.mount(container)
  const svg = container
    .querySelector('svg')!
    .outerHTML.replace(/(a[0-9a-z]{7}-[a-z0-9]+)-[\w-]+/g, '$1')
  expect(svg).toBe(expectedSvg({ seed: '' }))
  app.unmount()
})

test('vue: a bare face attribute turns the face on, as in a template', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  // `<Avatar face />` in a template compiles to `face: ''`.
  const app = createApp({ render: () => h(Avatar, { look: morph, seed: 'b', face: '' }) })
  app.mount(container)
  const svg = container
    .querySelector('svg')!
    .outerHTML.replace(/(a[0-9a-z]{7}-[a-z0-9]+)-[\w-]+/g, '$1')
  expect(svg).toBe(expectedSvg({ seed: 'b', face: true }))
  app.unmount()
})

const groupApps: App[] = []
const groupView = ({ look = 'morph', ...props }: GroupProps) => ({
  render: () => h(AvatarGroup, { look: STYLES[look], ...props }),
})

runGroupContract({
  name: 'vue',
  async render(props) {
    const container = document.createElement('div')
    document.body.append(container)
    const app = prefixed(createApp(groupView(props)))
    app.mount(container)
    groupApps.push(app)
    await nextTick()
    return container.querySelector<HTMLElement>('[data-opaline-group]')!
  },
  cleanup() {
    for (const app of groupApps.splice(0)) app.unmount()
  },
})

test('vue group: server markup hydrates without changes', async () => {
  const props: GroupProps = {
    members: ['ada', { seed: 'grace', alt: 'Grace' }, 'linus'],
    max: 2,
    look: 'clay',
  }
  const html = await renderToString(createSSRApp(groupView(props)))
  expect(html).toContain('+1')
  await catchHydration(async () => {
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.append(container)
    const app = createSSRApp(groupView(props))
    app.mount(container)
    groupApps.push(app)
    await nextTick()
  })
})
