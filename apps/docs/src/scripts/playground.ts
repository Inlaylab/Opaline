import { createAvatar, type Style } from '@inlaylab/opaline'
import { aura } from '@inlaylab/opaline/aura'
import { clay } from '@inlaylab/opaline/clay'
import { gradient } from '@inlaylab/opaline/gradient'
import { morph } from '@inlaylab/opaline/morph'

const STYLES: Record<string, Style<any>> = { morph, gradient, aura, clay }
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const val = (id: string) => $<HTMLInputElement | HTMLSelectElement>(id).value

type Opts = Record<string, string | number | undefined>

/** The options the user set, leaving out defaults so snippets stay short. */
function chosen(): { style: string; opts: Opts } {
  const style = val('pg-style')
  const opts: Opts = {}
  const set = (key: string, id: string, unset = '') => {
    const v = val(id)
    if (v !== unset) opts[key] = v
  }
  if (style !== 'aura') {
    set('finish', 'pg-finish')
    set('expression', 'pg-expression')
  }
  set('palette', 'pg-palette')
  if (style === 'clay') set('body', 'pg-body')
  if (style === 'aura') set('shape', 'pg-shape')
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
  const plain = (k: string, v: string) => `${k}="${v}"`
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
  for (const id of ['pg-body-field', 'pg-shape-field'])
    $(id).hidden = id === 'pg-body-field' ? style !== 'clay' : style !== 'aura'
  for (const id of ['pg-finish-field', 'pg-expression-field']) $(id).hidden = style === 'aura'
  // The hero follows the same seed in every style.
  for (const el of document.querySelectorAll<HTMLElement>('[data-hero]'))
    el.innerHTML = createAvatar(STYLES[el.dataset.hero!]!, {
      seed,
      size: 88,
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
  $('pg-tabs').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tab]')
    if (!b) return
    tab = b.dataset.tab!
    for (const x of $('pg-tabs').querySelectorAll('[data-tab]'))
      x.setAttribute('aria-selected', String(x === b))
    render()
  })
  $('pg-copy').addEventListener('click', async () => {
    const b = $('pg-copy')
    try {
      await navigator.clipboard.writeText($('pg-code').textContent ?? '')
      b.textContent = 'Copied'
    } catch {
      b.textContent = 'Copy failed'
    }
    setTimeout(() => (b.textContent = 'Copy'), 1400)
  })
  $('pg-download').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([lastSvg], { type: 'image/svg+xml' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${(val('pg-seed') || 'avatar').replace(/[^\w.-]+/g, '_').slice(0, 60)}.svg`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  })
  render()
}
