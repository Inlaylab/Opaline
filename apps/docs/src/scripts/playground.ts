import { createAvatar, type Style } from '@inlaylab/opaline'
import { aura } from '@inlaylab/opaline/aura'
import { clay } from '@inlaylab/opaline/clay'
import { gradient } from '@inlaylab/opaline/gradient'
import { initials } from '@inlaylab/opaline/initials'
import { morph } from '@inlaylab/opaline/morph'
import { toPng } from '@inlaylab/opaline/png'

const STYLES: Record<string, Style<any>> = { morph, gradient, aura, clay, initials }
/** Styles that always fill a tile, so their shape defaults to circle and they have no face. */
const TILED = new Set(['aura', 'initials'])
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const val = (id: string) => $<HTMLInputElement | HTMLSelectElement>(id).value

type Opts = Record<string, string | number | undefined>

/** URL parameter → control. Only these are read back from a shared link. */
const PARAMS: Record<string, string> = {
  seed: 'pg-seed',
  style: 'pg-style',
  finish: 'pg-finish',
  palette: 'pg-palette',
  expression: 'pg-expression',
  body: 'pg-body',
  shape: 'pg-shape',
  text: 'pg-text',
  size: 'pg-size',
}
const DEFAULTS: Record<string, string> = { seed: 'ada@inlay.dev', style: 'morph', size: '64' }

/** Fills the controls from `?seed=…&style=…`. Unknown values are ignored, never injected. */
function readLink(): void {
  const params = new URLSearchParams(location.search)
  for (const [key, id] of Object.entries(PARAMS)) {
    const v = params.get(key)
    if (v === null) continue
    const el = $<HTMLInputElement | HTMLSelectElement>(id)
    if (el instanceof HTMLSelectElement) {
      if ([...el.options].some((o) => o.value === v)) el.value = v
    } else el.value = v.slice(0, el.maxLength > 0 ? el.maxLength : 200)
  }
  $<HTMLInputElement>('hero-seed').value = val('pg-seed')
}

/** The link to exactly this avatar: only what differs from the defaults, so links stay short. */
function link(): string {
  const params = new URLSearchParams()
  const { style, opts } = chosen()
  const all: Record<string, string> = { seed: val('pg-seed'), style, size: val('pg-size') }
  for (const [k, v] of Object.entries(opts)) all[k] = String(v)
  for (const key of Object.keys(PARAMS))
    if (all[key] !== undefined && all[key] !== (DEFAULTS[key] ?? '')) params.set(key, all[key]!)
  const q = params.toString()
  return `${location.pathname}${q ? `?${q}` : ''}${location.hash}`
}

const fileName = (ext: string) =>
  `${(val('pg-seed') || 'avatar').replace(/[^\w.-]+/g, '_').slice(0, 60)}.${ext}`

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

/** The options the user set, leaving out defaults so snippets stay short. */
function chosen(): { style: string; opts: Opts } {
  const style = val('pg-style')
  const opts: Opts = {}
  const set = (key: string, id: string, unset = '') => {
    const v = val(id)
    if (v !== unset) opts[key] = v
  }
  if (!TILED.has(style)) {
    set('finish', 'pg-finish')
    set('expression', 'pg-expression')
  }
  set('palette', 'pg-palette')
  if (style === 'clay') set('body', 'pg-body')
  set('shape', 'pg-shape')
  if (style === 'initials' && val('pg-text').trim()) opts.text = val('pg-text')
  return { style, opts }
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

function render() {
  const seed = val('pg-seed')
  const size = Number(val('pg-size'))
  const { style, opts } = chosen()
  const look = STYLES[style]!
  // Light pane carries the plain output; the dark pane needs an instance so IDs never clash.
  const avatar = createAvatar(look, { seed, ...opts, size: 160 })
  $('pg-light').innerHTML = avatar.svg
  $('pg-dark').innerHTML = createAvatar(look, { seed, ...opts, size: 160, instance: 'd' }).svg
  lastSvg = createAvatar(look, { seed, ...opts, size }).svg
  const code =
    tab === 'svg'
      ? lastSvg
      : tab === 'json'
        ? JSON.stringify(avatar.toJSON(), null, 2)
        : snippet(tab, seed, style, opts, size)
  $('pg-code').textContent = code
  $('pg-body-field').hidden = style !== 'clay'
  $('pg-text-field').hidden = style !== 'initials'
  for (const id of ['pg-finish-field', 'pg-expression-field']) $(id).hidden = TILED.has(style)
  // The empty option is each style's own default: a circle tile, or no tile at all.
  $('pg-shape').querySelector('option')!.textContent = TILED.has(style)
    ? 'circle (default)'
    : 'none (default)'
  // The address bar always holds a link to what is on screen.
  if (link() !== location.pathname + location.search + location.hash)
    history.replaceState(history.state, '', link())
  // The hero follows the same seed in every style.
  for (const el of document.querySelectorAll<HTMLElement>('[data-hero]'))
    el.innerHTML = createAvatar(STYLES[el.dataset.hero!]!, {
      seed,
      size: 96,
      instance: 'h',
    }).svg
}

export function initPlayground(): void {
  const seed = $<HTMLInputElement>('pg-seed')
  const hero = $<HTMLInputElement>('hero-seed')
  hero.addEventListener('input', () => {
    seed.value = hero.value
    render()
  })
  seed.addEventListener('input', () => {
    hero.value = seed.value
    render()
  })
  for (const el of document.querySelectorAll('#pg-controls select'))
    el.addEventListener('change', render)
  $('pg-text').addEventListener('input', render)
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
    const url = new URL(link(), location.href)
    url.hash = 'playground'
    try {
      await navigator.clipboard.writeText(url.href)
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
  readLink()
  render()
}
