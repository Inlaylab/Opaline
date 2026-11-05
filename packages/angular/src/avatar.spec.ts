import {
  ApplicationRef,
  Component,
  ComponentRef,
  createComponent,
  provideZonelessChangeDetection,
} from '@angular/core'
import { createApplication } from '@angular/platform-browser'
import {
  runContract,
  runGroupContract,
  STYLES,
  type GroupProps,
  type Props,
} from '@inlaylab/opaline-contract'
import { IV_AVATAR_IMPORTS } from '@inlaylab/ivorie/avatar'
import { OpalineAvatar } from './avatar'
import { OpalineAvatarGroup } from './group'

let app: ApplicationRef
const refs = new Map<HTMLElement, ComponentRef<OpalineAvatar>>()

const INPUTS = [
  'finish',
  'body',
  'ears',
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
  'text',
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
    // Static attributes, as a template user writes them (`<op-avatar seed="..." alt="..." />`).
    for (const [key, value] of Object.entries(props))
      if (typeof value === 'string' || typeof value === 'number')
        host.setAttribute(key, String(value))
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

@Component({
  imports: [OpalineAvatar],
  template: `<op-avatar
    seed="ada@inlay.dev"
    alt="Ada"
    finish="gloss"
    body="hood"
    ears="bunny"
    [look]="look"
  />`,
})
class StaticAttributes {
  look = STYLES.clay
}

test('angular: static template attributes do not stay on the root', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  const ref = createComponent(StaticAttributes, {
    environmentInjector: app.injector,
    hostElement: host,
  })
  app.attachView(ref.hostView)
  await app.whenStable()
  const root = host.querySelector<HTMLElement>('[data-opaline]')!
  expect(root.getAttribute('aria-label')).toBe('Ada')
  for (const name of ['seed', 'alt', 'finish', 'body', 'ears'])
    expect(root.hasAttribute(name)).toBe(false)
  expect(host.innerHTML).not.toContain('ada@inlay.dev')
  ref.destroy()
})

const groupRefs: ComponentRef<OpalineAvatarGroup>[] = []

runGroupContract({
  name: 'angular',
  async render({ look = 'morph', ...props }: GroupProps) {
    const host = document.createElement('op-avatar-group')
    document.body.append(host)
    const ref = createComponent(OpalineAvatarGroup, {
      environmentInjector: app.injector,
      hostElement: host,
    })
    app.attachView(ref.hostView)
    groupRefs.push(ref)
    ref.setInput('look', STYLES[look])
    for (const [key, value] of Object.entries(props)) ref.setInput(key, value)
    await app.whenStable()
    return host
  },
  cleanup() {
    for (const ref of groupRefs.splice(0)) ref.destroy()
  },
})

@Component({
  imports: [OpalineAvatarGroup],
  template: `<op-avatar-group alt="Team" max="2" size="32" [members]="people" [look]="look" />`,
})
class StaticGroup {
  look = STYLES.initials
  people = ['ada lovelace', 'grace hopper', 'linus']
}

test('angular group: static attributes work and do not stay on the host', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  const ref = createComponent(StaticGroup, { environmentInjector: app.injector, hostElement: host })
  app.attachView(ref.hostView)
  await app.whenStable()
  const root = host.querySelector<HTMLElement>('[data-opaline-group]')!
  expect(root.getAttribute('aria-label')).toBe('Team')
  expect(root.querySelector('[data-opaline-more]')!.textContent!.trim()).toBe('+1')
  for (const name of ['alt', 'max', 'size']) expect(root.hasAttribute(name)).toBe(false)
  ref.destroy()
})
