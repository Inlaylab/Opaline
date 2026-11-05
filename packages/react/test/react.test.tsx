import { expect, test } from 'vitest'
import {
  runContract,
  runGroupContract,
  STYLES,
  type GroupProps,
  type Props,
} from '@inlaylab/opaline-contract'
import { act } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { Avatar, AvatarGroup } from '../src/index.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const roots = new Map<HTMLElement, Root>()
const view = ({ look = 'morph', ...props }: Props) => <Avatar look={STYLES[look]} {...props} />
const rootOf = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-opaline]')!

runContract({
  name: 'react',
  async render(props) {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    roots.set(container, root)
    await act(async () => root.render(view(props)))
    return rootOf(container)
  },
  async update(el, props) {
    const container = el.parentElement!
    await act(async () => roots.get(container)!.render(view(props)))
    return rootOf(container)
  },
  async ssr(props) {
    const html = renderToString(view(props))
    return {
      html,
      async hydrate() {
        const container = document.createElement('div')
        container.innerHTML = html
        document.body.append(container)
        const errors: unknown[] = []
        await act(async () => {
          roots.set(
            container,
            hydrateRoot(container, view(props), { onRecoverableError: (e) => errors.push(e) }),
          )
        })
        if (errors.length) throw new Error(`hydration mismatch: ${String(errors[0])}`)
        return rootOf(container)
      },
    }
  },
  cleanup() {
    for (const root of roots.values()) act(() => root.unmount())
    roots.clear()
  },
})

const groupRoots: Root[] = []

runGroupContract({
  name: 'react',
  async render({ look = 'morph', ...props }: GroupProps) {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    groupRoots.push(root)
    await act(async () => root.render(<AvatarGroup look={STYLES[look]} {...props} />))
    return container.querySelector<HTMLElement>('[data-opaline-group]')!
  },
  cleanup() {
    for (const root of groupRoots.splice(0)) act(() => root.unmount())
  },
})

test('react group: server markup hydrates without changes', async () => {
  const view = (
    <AvatarGroup
      look={STYLES.clay}
      members={['ada', { seed: 'grace', alt: 'Grace' }, 'linus']}
      max={2}
    />
  )
  const html = renderToString(view)
  expect(html).toContain('+1')
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.append(container)
  const errors: unknown[] = []
  await act(async () => {
    groupRoots.push(hydrateRoot(container, view, { onRecoverableError: (e) => errors.push(e) }))
  })
  expect(errors).toEqual([])
})
