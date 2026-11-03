import { runContract, type Props } from '@inlaylab/opaline-contract'
import { expect, test } from 'vitest'
import '../src/index.ts'

const setProps = (host: HTMLElement, props: Props) => {
  for (const a of [...host.attributes]) host.removeAttribute(a.name)
  for (const [k, v] of Object.entries(props)) if (v !== undefined) host.setAttribute(k, String(v))
}

runContract({
  name: 'element',
  async render(props) {
    const host = document.createElement('opaline-avatar')
    setProps(host, props)
    document.body.append(host)
    return host.querySelector<HTMLElement>('[data-opaline]')!
  },
  async update(root, props) {
    const host = root.closest('opaline-avatar') as HTMLElement
    setProps(host, props)
    return host.querySelector<HTMLElement>('[data-opaline]')!
  },
})

test('element: upgrades with one render, not one per attribute', async () => {
  const renders: MutationRecord[] = []
  const observer = new MutationObserver((records) =>
    renders.push(...records.filter((r) => (r.target as Element).localName === 'opaline-avatar')),
  )
  observer.observe(document.body, { childList: true, subtree: true })
  document.body.innerHTML =
    '<opaline-avatar seed="a" look="gradient" size="48" palette="cool"></opaline-avatar>'
  await new Promise((r) => setTimeout(r))
  observer.disconnect()
  expect(renders).toHaveLength(1)
})

test('element: unknown look falls back to morph', () => {
  document.body.innerHTML = '<opaline-avatar seed="a" look="constructor"></opaline-avatar>'
  expect(document.querySelector('opaline-avatar svg')).toBeTruthy()
})
