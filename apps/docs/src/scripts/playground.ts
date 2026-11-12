import { createAvatar, type Style } from '@inlaylab/opaline'
import { aura } from '@inlaylab/opaline/aura'
import { clay } from '@inlaylab/opaline/clay'
import { gradient } from '@inlaylab/opaline/gradient'
import { initials } from '@inlaylab/opaline/initials'
import { morph } from '@inlaylab/opaline/morph'
import { pip } from '@inlaylab/opaline/pip'
import { plush } from '@inlaylab/opaline/plush'
import { toPng } from '@inlaylab/opaline/png'
import { randomHero } from './heroes'

const STYLES: Record<string, Style<any>> = { morph, gradient, aura, clay, initials, plush, pip }
/** Styles that always fill a tile, so their shape defaults to circle and they have no face. */
const TILED = new Set(['aura', 'initials'])
/** Every control, by name. Its value is `#pg-<name>` (input or select) or the checked `pg-<name>` radio. */
const FIELDS = [
  'seed',
  'style',
  'finish',
  'palette',
  'expression',
  'body',
  'accessory',
  'form',
  'shape',
  'text',
  'size',
]
/** Plush has no finish (its gummy look is its finish); Pip has pill eyes, not expressions. */
const NO_FINISH = new Set(['aura', 'initials', 'plush'])
const NO_EXPRESSION = new Set(['aura', 'initials', 'pip'])
const DEFAULTS: Record<string, string> = { seed: 'Starfire', style: 'morph', size: '64' }

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const control = (name: string) => {
  const el = document.getElementById(`pg-${name}`)
  return el instanceof HTMLInputElement || el instanceof HTMLSelectElement ? el : null
}
const radios = (name: string) => [
  ...document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="pg-${name}"]`),
]

function field(name: string): string {
  return control(name)?.value ?? radios(name).find((r) => r.checked)?.value ?? ''
}

/** Sets a control. Values that are not one of its options are ignored, never injected. */
function setField(name: string, v: string): void {
  const el = control(name)
  if (el instanceof HTMLSelectElement) {
    if ([...el.options].some((o) => o.value === v)) el.value = v
  } else if (el) el.value = v.slice(0, el.maxLength > 0 ? el.maxLength : 200)
  else {
    const r = radios(name).find((x) => x.value === v)
    if (r) r.checked = true
  }
}

type Opts = Record<string, string | number | undefined>

/** The options the user set, leaving out defaults so snippets stay short. */
function chosen(): { style: string; opts: Opts } {
  const style = field('style')
  const opts: Opts = {}
  const set = (key: string) => {
    const v = field(key)
    if (v) opts[key] = v
  }
  if (!NO_FINISH.has(style)) set('finish')
  if (!NO_EXPRESSION.has(style)) set('expression')
  set('palette')
  if (style === 'clay') set('body')
  if (style === 'plush') set('accessory')
  if (style === 'pip') set('form')
  set('shape')
  if (style === 'initials' && field('text').trim()) opts.text = field('text')
  return { style, opts }
}

/** The link to exactly this avatar: only what differs from the defaults, so links stay short. */
function link(): string {
  const params = new URLSearchParams()
  const { style, opts } = chosen()
  const all: Record<string, string> = { seed: field('seed'), style, size: field('size') }
  for (const [k, v] of Object.entries(opts)) all[k] = String(v)
  for (const key of FIELDS)
    if (all[key] !== undefined && all[key] !== (DEFAULTS[key] ?? '')) params.set(key, all[key]!)
  const q = params.toString()
  return `${location.pathname}${q ? `?${q}` : ''}${location.hash}`
}

function readLink(): void {
  const params = new URLSearchParams(location.search)
  for (const name of FIELDS) {
    const v = params.get(name)
    if (v !== null) setField(name, v)
  }
}

function reset(): void {
  for (const name of FIELDS) {
    const el = control(name)
    if (el) el.value = DEFAULTS[name] ?? ''
    else for (const r of radios(name)) r.checked = r.value === (DEFAULTS[name] ?? '')
  }
}

const fileName = (ext: string) =>
  `${(field('seed') || 'avatar').replace(/[^\w.-]+/g, '_').slice(0, 60)}.${ext}`

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Shows `text` on a button for a moment, then its label again. */
function flash(id: string, text: string): void {
  const b = $(id)
  const label = b.dataset.label ?? (b.dataset.label = b.textContent ?? '')
  b.textContent = text
  setTimeout(() => (b.textContent = label), 1400)
}

/** A JS string literal: safe inside `{…}` in JSX and Svelte, whatever the seed holds. */
const js = (v: string) => JSON.stringify(v)
/** Escapes text for a double-quoted HTML attribute. */
const html = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const attrs = (opts: Opts, fmt: (k: string, v: string) => string) =>
  Object.entries(opts)
    .map(([k, v]) => ' ' + fmt(k, String(v)))
    .join('')

function snippet(fw: string, seed: string, style: string, opts: Opts, size: number): string {
  const imp = `import { ${style} } from '@inlaylab/opaline/${style}'`
  const sz = size === 64 ? '' : String(size)
  // `text` is typed by the user, so attribute values are escaped like the seed.
  const plain = (k: string, v: string) => `${k}="${html(v)}"`
  switch (fw) {
    case 'element':
      return `<script type="module">import '@inlaylab/opaline-element'</script>\n\n<opaline-avatar seed="${html(seed)}" look="${style}"${sz ? ` size="${sz}"` : ''}${attrs(opts, plain)}></opaline-avatar>`
    case 'react':
      return `import { Avatar } from '@inlaylab/opaline-react'\n${imp}\n\n<Avatar seed={${js(seed)}} look={${style}}${sz ? ` size={${sz}}` : ''}${attrs(opts, plain)} />`
    case 'vue':
      return `<script setup>\nimport { Avatar } from '@inlaylab/opaline-vue'\n${imp}\n</script>\n\n<template>\n  <Avatar :seed="${html(js(seed))}" :look="${style}"${sz ? ` :size="${sz}"` : ''}${attrs(opts, plain)} />\n</template>`
    case 'svelte':
      return `<script>\n  import { Avatar } from '@inlaylab/opaline-svelte'\n  ${imp}\n</script>\n\n<Avatar seed={${js(seed)}} look={${style}}${sz ? ` size={${sz}}` : ''}${attrs(opts, plain)} />`
    case 'angular':
      return `import { Component } from '@angular/core'\nimport { OpalineAvatar } from '@inlaylab/opaline-angular'\n${imp}\n\n@Component({\n  selector: 'app-user-avatar',\n  imports: [OpalineAvatar],\n  template: \`\n    <op-avatar [seed]="${html(js(seed)).replace(/[`\\$]/g, '\\$&')}" [look]="${style}"${sz ? ` [size]="${sz}"` : ''}${attrs(opts, plain)} />\n  \`,\n})\nexport class UserAvatar {\n  protected readonly ${style} = ${style}\n}`
    default:
      return `import { createAvatar } from '@inlaylab/opaline'\n${imp}\n\ncreateAvatar(${style}, ${JSON.stringify({ seed, ...(sz ? { size } : {}), ...opts }, null, 2)}).svg`
  }
}

let tab = 'core'
let lastSvg = ''

function render(): void {
  const seed = field('seed')
  const size = Number(field('size'))
  const { style, opts } = chosen()
  const look = STYLES[style]!
  // The light pane carries the plain output; every other copy needs an instance so IDs never clash.
  const avatar = createAvatar(look, { seed, ...opts, size: 176 })
  // The site accent follows the seed's hue, like every style does.
  document.documentElement.style.setProperty('--hue', String(avatar.toJSON().hue))
  $('pg-light').innerHTML = avatar.svg
  $('pg-dark').innerHTML = createAvatar(look, { seed, ...opts, size: 176, instance: 'd' }).svg
  for (const el of document.querySelectorAll<HTMLElement>('[data-at]'))
    el.innerHTML = createAvatar(look, {
      seed,
      ...opts,
      size: Number(el.dataset.at),
      instance: `z${el.dataset.at}`,
    }).svg
  // Style cards and palette swatches preview the current seed.
  for (const el of document.querySelectorAll<HTMLElement>('[data-thumb]'))
    el.innerHTML = createAvatar(STYLES[el.dataset.thumb!]!, {
      seed,
      size: 44,
      instance: 't',
    }).svg
  for (const el of document.querySelectorAll<HTMLElement>('[data-swatch]'))
    el.innerHTML = createAvatar(aura, {
      seed,
      palette: (el.dataset.swatch || undefined) as never,
      size: 28,
      instance: `p${el.dataset.swatch}`,
    }).svg
  lastSvg = createAvatar(look, { seed, ...opts, size }).svg
  $('pg-code').textContent =
    tab === 'svg'
      ? lastSvg
      : tab === 'json'
        ? JSON.stringify(avatar.toJSON(), null, 2)
        : snippet(tab, seed, style, opts, size)
  $('pg-body-field').hidden = style !== 'clay'
  $('pg-text-field').hidden = style !== 'initials'
  $('pg-accessory-field').hidden = style !== 'plush'
  $('pg-form-field').hidden = style !== 'pip'
  $('pg-finish-field').hidden = NO_FINISH.has(style)
  $('pg-expression-field').hidden = NO_EXPRESSION.has(style)
  // The first shape option is each style's own default: a circle tile, or no tile at all.
  $('pg-shape-default').textContent = TILED.has(style) ? 'Circle' : 'None'
  $('pg-caption').textContent = `${style} · ${size}px`
  // The address bar always holds a link to what is on screen.
  if (link() !== location.pathname + location.search + location.hash)
    history.replaceState(history.state, '', link())
}

export function initPlayground(): void {
  readLink()
  const controls = $('pg-controls')
  controls.addEventListener('input', render)
  controls.addEventListener('change', render)
  // Export size sits under the code, outside the form: without this the caption, code and PNG kept
  // the old size until some other control re-rendered, and that late re-render could shift the
  // buttons between mouse down and up, so a PNG click was lost.
  $('pg-size').addEventListener('change', render)
  $('pg-shuffle').addEventListener('click', () => {
    setField('seed', randomHero(field('seed')))
    render()
  })
  $('pg-reset').addEventListener('click', () => {
    reset()
    render()
  })
  $('pg-tabs').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tab]')
    if (!b) return
    tab = b.dataset.tab!
    for (const x of $('pg-tabs').querySelectorAll('[data-tab]'))
      x.setAttribute('aria-selected', String(x === b))
    render()
  })
  $('pg-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('pg-code').textContent ?? '')
      flash('pg-copy', 'Copied')
    } catch {
      flash('pg-copy', 'Copy failed')
    }
  })
  $('pg-share').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(new URL(link(), location.href).href)
      flash('pg-share', 'Link copied')
    } catch {
      flash('pg-share', 'Copy failed')
    }
  })
  $('pg-download').addEventListener('click', () =>
    download(new Blob([lastSvg], { type: 'image/svg+xml' }), fileName('svg')),
  )
  $('pg-png').addEventListener('click', async () => {
    try {
      download(await toPng(lastSvg), fileName('png'))
    } catch {
      flash('pg-png', 'PNG failed')
    }
  })
  render()
}
