import { runContract, type Props } from '@inlaylab/opaline-contract'
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
