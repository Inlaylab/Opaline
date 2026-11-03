import {
  ApplicationRef,
  Component,
  ComponentRef,
  createComponent,
  provideZonelessChangeDetection,
} from '@angular/core'
import { createApplication } from '@angular/platform-browser'
import { runContract, STYLES, type Props } from '@inlaylab/opaline-contract'
import { IV_AVATAR_IMPORTS } from '@inlaylab/ivorie/avatar'
import { OpalineAvatar } from './avatar'

let app: ApplicationRef
const refs = new Map<HTMLElement, ComponentRef<OpalineAvatar>>()

const INPUTS = [
  'seed',
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
] as const

async function apply(ref: ComponentRef<OpalineAvatar>, { look = 'morph', ...props }: Props) {
  ref.setInput('look', STYLES[look])
  for (const key of INPUTS) ref.setInput(key, (props as Record<string, unknown>)[key])
  await app.whenStable()
}

beforeAll(async () => {
  app = await createApplication({ providers: [provideZonelessChangeDetection()] })
})

runContract({
  name: 'angular',
  async render(props) {
    const host = document.createElement('op-avatar')
    document.body.append(host)
    const ref = createComponent(OpalineAvatar, {
      environmentInjector: app.injector,
      hostElement: host,
    })
    app.attachView(ref.hostView)
    refs.set(host, ref)
    await apply(ref, props)
    return host
  },
  async update(root, props) {
    await apply(refs.get(root)!, props)
    return root
  },
  cleanup() {
    for (const ref of refs.values()) ref.destroy()
    refs.clear()
  },
})

@Component({
  imports: [IV_AVATAR_IMPORTS, OpalineAvatar],
  template: `<iv-avatar
    ><iv-avatar-fallback><op-avatar seed="ada" [look]="look" /></iv-avatar-fallback
  ></iv-avatar>`,
})
class InIvorie {
  look = STYLES.morph
}

test('angular: works as the fallback of an Ivorie avatar', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  const ref = createComponent(InIvorie, { environmentInjector: app.injector, hostElement: host })
  app.attachView(ref.hostView)
  await app.whenStable()
  expect(host.querySelector('iv-avatar-fallback op-avatar svg')).toBeTruthy()
  ref.destroy()
})
