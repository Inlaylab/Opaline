import type { ChildProcess } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createAvatar } from '@inlaylab/opaline'
import { clay } from '@inlaylab/opaline/clay'
import { initials } from '@inlaylab/opaline/initials'
import { morph } from '@inlaylab/opaline/morph'
import { chromium, type Browser, type BrowserContextOptions } from 'playwright'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { runSync, startServer, stopServer } from '../../tools/spawn-server.ts'

const cwd = fileURLToPath(new URL('.', import.meta.url))
const PORT = 4320
const URL_ = `http://localhost:${PORT}/Opaline/`
const PG = `${URL_}playground/`
let server: ChildProcess
let browser: Browser

// Astro runs preview as a daemon: stop any earlier one so the test never hits a stale build.
const stopPreview = () =>
  runSync('pnpm', ['exec', 'astro', 'preview', 'stop'], { cwd, stdio: 'ignore' })

beforeAll(async () => {
  stopPreview()
  server = startServer('pnpm', ['exec', 'astro', 'preview', '--port', String(PORT)], {
    cwd,
    stdio: 'ignore',
  })
  const end = Date.now() + 30_000
  for (;;) {
    try {
      if ((await fetch(URL_)).ok) break
    } catch {}
    if (Date.now() > end) throw new Error('preview did not start')
    await new Promise((r) => setTimeout(r, 250))
  }
  browser = await chromium.launch()
})

afterAll(async () => {
  await browser?.close()
  stopServer(server)
  stopPreview()
})

// Tests never touch the network: outside requests (the Google Fonts stylesheet) would make every
// page load wait on the internet, which is slow or blocked on some machines.
async function newContext(options?: BrowserContextOptions) {
  const ctx = await browser.newContext(options)
  await ctx.route(
    (url) => url.hostname !== 'localhost',
    (route) => route.abort(),
  )
  return ctx
}
const newPage = async (options?: BrowserContextOptions) => (await newContext(options)).newPage()

/** Clicks a playground radio (style card, palette swatch or segment) the way a person would. */
const pick = (page: import('playwright').Page, name: string, value: string) =>
  page.locator(`label:has(> input[name="pg-${name}"][value="${value}"])`).click()
const picked = (page: import('playwright').Page, name: string) =>
  page.locator(`input[name="pg-${name}"]:checked`).inputValue()

const strip = (svg: string) => svg.replace(/a[0-9a-z]{7}-/g, 'ID-')

test('the playground shows the core output for the chosen options', async () => {
  const page = await newPage()
  await page.goto(PG)
  await page.fill('#pg-seed', 'grace@inlay.dev')
  await pick(page, 'style', 'clay')
  await pick(page, 'finish', 'gloss')
  const svg = await page
    .locator('#pg-preview svg')
    .first()
    .evaluate((e) => e.outerHTML)
  const expected = createAvatar(clay, { seed: 'grace@inlay.dev', finish: 'gloss', size: 176 }).svg
  // Compare after serializing the expected markup in the page, the same way the preview is.
  const serialized = await page.evaluate((s) => {
    const t = document.createElement('template')
    t.innerHTML = s
    return t.innerHTML
  }, expected)
  expect(strip(svg)).toBe(strip(serialized))
})

async function previewMatches(page: import('playwright').Page, expected: string) {
  const svg = await page
    .locator('#pg-preview svg')
    .first()
    .evaluate((e) => e.outerHTML)
  const serialized = await page.evaluate((s) => {
    const t = document.createElement('template')
    t.innerHTML = s
    return t.innerHTML
  }, expected)
  expect(strip(svg)).toBe(strip(serialized))
}

test('the playground draws initials with a shape and custom text', async () => {
  const page = await newPage()
  await page.goto(PG)
  await page.fill('#pg-seed', 'grace hopper')
  await pick(page, 'style', 'initials')
  await pick(page, 'shape', 'square')
  await previewMatches(
    page,
    createAvatar(initials, { seed: 'grace hopper', shape: 'square', size: 176 }).svg,
  )
  await page.fill('#pg-text', 'Op')
  await previewMatches(
    page,
    createAvatar(initials, { seed: 'grace hopper', shape: 'square', text: 'Op', size: 176 }).svg,
  )
  expect(await page.locator('#pg-code').textContent()).toContain('"text": "Op"')
})

test('every style offers every shape', async () => {
  const page = await newPage()
  await page.goto(PG)
  await pick(page, 'style', 'morph')
  expect(await page.locator('#pg-shape-field').isVisible()).toBe(true)
  expect(await page.locator('#pg-shape-field label').allTextContents()).toEqual([
    'None',
    'circle',
    'squircle',
    'square',
  ])
  await pick(page, 'shape', 'squircle')
  await previewMatches(
    page,
    createAvatar(morph, { seed: 'Starfire', shape: 'squircle', size: 176 }).svg,
  )
  await pick(page, 'style', 'aura')
  expect(await page.locator('#pg-shape-default').textContent()).toBe('Circle')
})

test('user input is escaped, never rendered as markup', async () => {
  const page = await newPage()
  await page.goto(PG)
  await page.fill('#pg-seed', '<b>x</b>')
  expect(await page.locator('#pg-preview b').count()).toBe(0)
  expect(await page.locator('#pg-preview svg').count()).toBeGreaterThan(0)
  await page.fill('#pg-seed', '')
  expect(await page.locator('#pg-preview svg').count()).toBeGreaterThan(0)
})

test('copy puts the snippet on the clipboard', async () => {
  const ctx = await newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await ctx.newPage()
  await page.goto(PG)
  await page.fill('#pg-seed', 'copy-me')
  await page.click('#pg-copy')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('copy-me')
  await ctx.close()
})

test('every snippet carries the exact seed, even with quotes, backslashes and braces', async () => {
  const page = await newPage()
  await page.goto(PG)
  const seed = 'a"b\\c{x}{{y}}<i>'
  await page.fill('#pg-seed', seed)
  for (const tab of ['core', 'element', 'react', 'vue', 'svelte', 'angular']) {
    await page.click(`[data-tab="${tab}"]`)
    const code = (await page.locator('#pg-code').textContent())!
    // Read the seed back the way each framework would.
    const back = await page.evaluate(
      ([tab, code]) => {
        const decode = (s: string) => {
          const t = document.createElement('textarea')
          t.innerHTML = s
          return t.value
        }
        const js = /("(?:[^"\\]|\\.)*")/.source
        if (tab === 'element') {
          const doc = new DOMParser().parseFromString(code.split('\n').pop()!, 'text/html')
          return doc.querySelector('opaline-avatar')?.getAttribute('seed')
        }
        if (tab === 'core') return JSON.parse(code.match(new RegExp('"seed": ' + js))![1]!)
        if (tab === 'react' || tab === 'svelte')
          return JSON.parse(code.match(new RegExp('seed=\\{' + js + '\\}'))![1]!)
        const attr = tab === 'vue' ? ':seed' : '\\[seed\\]'
        let raw = code.match(new RegExp(attr + '="([^"]*)"'))![1]!
        // Angular's template sits in a TS template literal: undo that layer first.
        if (tab === 'angular') raw = raw.replace(/\\([`\\$])/g, '$1')
        return JSON.parse(decode(raw))
      },
      [tab, code] as const,
    )
    expect(back, tab).toBe(seed)
  }
})

test('the Angular snippet separates component code from the template', async () => {
  const page = await newPage()
  await page.goto(PG)
  await page.click('[data-tab="angular"]')
  const code = (await page.locator('#pg-code').textContent())!
  expect(code).toContain('imports: [OpalineAvatar]')
  expect(code).toMatch(/protected readonly morph = morph/)
  expect(code).toMatch(/template: `\s*<op-avatar/)
})

test('the theme toggle persists across reloads', async () => {
  const page = await newPage({ colorScheme: 'light' })
  await page.goto(URL_)
  await page.click('#theme-toggle')
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
  await page.reload()
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
})

test('style-specific controls hide for other styles', async () => {
  const page = await newPage()
  await page.goto(PG)
  await pick(page, 'style', 'morph')
  expect(await page.locator('#pg-body-field').isVisible()).toBe(false)
  await pick(page, 'style', 'clay')
  expect(await page.locator('#pg-body-field').isVisible()).toBe(true)
  expect(await page.locator('#pg-text-field').isVisible()).toBe(false)
  await pick(page, 'style', 'initials')
  expect(await page.locator('#pg-text-field').isVisible()).toBe(true)
  expect(await page.locator('#pg-finish-field').isVisible()).toBe(false)
  expect(await page.locator('#pg-expression-field').isVisible()).toBe(false)
  await pick(page, 'style', 'plush')
  expect(await page.locator('#pg-accessory-field').isVisible()).toBe(true)
  expect(await page.locator('#pg-finish-field').isVisible()).toBe(false)
  expect(await page.locator('#pg-expression-field').isVisible()).toBe(true)
  await pick(page, 'style', 'pip')
  expect(await page.locator('#pg-form-field').isVisible()).toBe(true)
  expect(await page.locator('#pg-accessory-field').isVisible()).toBe(false)
  expect(await page.locator('#pg-finish-field').isVisible()).toBe(true)
  expect(await page.locator('#pg-expression-field').isVisible()).toBe(false)
})

test('plush and pip options reach the link and the code', async () => {
  const page = await newPage()
  await page.goto(`${PG}?seed=ada&style=plush&accessory=beret`)
  expect(await page.locator('#pg-accessory').inputValue()).toBe('beret')
  expect(await page.locator('#pg-code').textContent()).toContain('"accessory": "beret"')
  await page.goto(`${PG}?seed=ada&style=pip&form=heart`)
  expect(await page.locator('#pg-form').inputValue()).toBe('heart')
  expect(await page.locator('#pg-code').textContent()).toContain('"form": "heart"')
})

/**
 * Fonts never load in tests, so text falls back to a system font, and that differs by machine.
 * DejaVu Sans is wide and ships on GitHub's Ubuntu runners: forcing it here makes a layout that
 * only fits with a narrow local font fail on every machine, not just in CI.
 */
async function expectNoHorizontalScroll(path: string) {
  for (const width of [375, 320])
    for (const font of [null, 'DejaVu Sans']) {
      const page = await newPage({ viewport: { width, height: 800 } })
      await page.goto(URL_ + path)
      if (font) await page.addStyleTag({ content: `* { font-family: '${font}' !important }` })
      const [sw, cw] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ])
      expect(sw, `${width}px, ${font ?? 'default font'}`).toBeLessThanOrEqual(cw)
      await page.context().close()
    }
}

test('no horizontal scroll at phone width', () => expectNoHorizontalScroll(''))
test('no horizontal scroll on the playground at phone width', () =>
  expectNoHorizontalScroll('playground/'))
test('no horizontal scroll on the docs at phone width', () => expectNoHorizontalScroll('docs/'))

test('built HTML only references assets under the Pages base', () => {
  const pages = readdirSync(`${cwd}dist`, { recursive: true, encoding: 'utf8' }).filter((f) =>
    f.endsWith('.html'),
  )
  expect(pages).toContain('compare/index.html')
  const html = pages.map((f) => readFileSync(`${cwd}dist/${f}`, 'utf8')).join('')
  expect(html).not.toMatch(/(?:src|href)="\/(?!Opaline\/)[^/"]/)
})

test('a shared link opens the playground on that exact avatar', async () => {
  const page = await newPage()
  await page.goto(`${PG}?seed=grace+hopper&style=initials&shape=squircle&text=Op`)
  expect(await picked(page, 'style')).toBe('initials')
  expect(await picked(page, 'shape')).toBe('squircle')
  expect(await page.inputValue('#pg-seed')).toBe('grace hopper')
  await previewMatches(
    page,
    createAvatar(initials, { seed: 'grace hopper', shape: 'squircle', text: 'Op', size: 176 }).svg,
  )
})

test('the address bar follows the controls, and Share copies it', async () => {
  const ctx = await newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await ctx.newPage()
  await page.goto(PG)
  // Defaults leave the address clean.
  expect(new URL(page.url()).search).toBe('')
  await page.fill('#pg-seed', 'a&b c')
  await pick(page, 'style', 'clay')
  await pick(page, 'finish', 'gloss')
  const params = new URL(page.url()).searchParams
  expect(Object.fromEntries(params)).toEqual({ seed: 'a&b c', style: 'clay', finish: 'gloss' })
  await page.click('#pg-share')
  const shared = new URL(await page.evaluate(() => navigator.clipboard.readText()))
  expect(shared.pathname).toBe('/Opaline/playground/')
  expect(shared.searchParams.get('seed')).toBe('a&b c')
  // The copied link restores the same state in a fresh page.
  const again = await ctx.newPage()
  await again.goto(shared.href)
  expect(await picked(again, 'finish')).toBe('gloss')
  await previewMatches(again, createAvatar(clay, { seed: 'a&b c', finish: 'gloss', size: 176 }).svg)
  await ctx.close()
})

test('unknown link values are ignored', async () => {
  const page = await newPage()
  await page.goto(`${PG}?style=constructor&size=99999&palette=%3Cb%3E`)
  expect(await picked(page, 'style')).toBe('morph')
  expect(await page.inputValue('#pg-size')).toBe('64')
  expect(await picked(page, 'palette')).toBe('')
})

test('PNG downloads a real PNG at the chosen size', async () => {
  const page = await newPage()
  await page.goto(PG)
  await page.fill('#pg-seed', 'png me')
  await page.selectOption('#pg-size', '128')
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#pg-png')])
  expect(download.suggestedFilename()).toBe('png_me.png')
  const bytes = readFileSync((await download.path())!)
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  // Width and height sit in the IHDR chunk, right after the signature.
  expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([128, 128])
})

test('the demos render avatars and groups with +N chips', async () => {
  const page = await newPage()
  await page.goto(URL_)
  const demos = page.locator('#demos')
  expect(await demos.locator('opaline-avatar svg').count()).toBeGreaterThan(10)
  expect(await demos.locator('[data-opaline-more]').allTextContents()).toEqual(['+5', '+3', '+2'])
  expect(await demos.locator('.admin-table tbody tr').count()).toBe(4)
})

test('the compare page lists all three libraries and links home', async () => {
  const page = await newPage()
  await page.goto(`${URL_}compare/`)
  expect(await page.locator('.compare-table thead th').allTextContents()).toEqual([
    '',
    'Opaline',
    'DiceBear',
    'Boring Avatars',
  ])
  expect(await page.locator('.compare-table tbody tr').count()).toBeGreaterThan(8)
  await page.click('.nav a[href$="/playground/"]')
  await page.waitForURL(/\/Opaline\/playground\/$/)
})

test('no horizontal scroll on the compare page at phone width', () =>
  expectNoHorizontalScroll('compare/'))

test('the docs follow the chosen framework and package manager', async () => {
  const ctx = await newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await ctx.newPage()
  await page.goto(`${URL_}docs/`)
  const visible = () => page.locator('.steps:visible')
  expect(await visible().getAttribute('data-fw')).toBe('react')
  await page.click('[data-pick="vue"]')
  expect(await visible().getAttribute('data-fw')).toBe('vue')
  expect(await page.locator('#groups .codeblock:visible pre').textContent()).toContain(
    'AvatarGroup',
  )
  await page.locator('.steps:visible [data-pm="pnpm"]').click()
  const install = page.locator('.steps:visible [data-install]')
  expect(await install.textContent()).toBe('pnpm add @inlaylab/opaline @inlaylab/opaline-vue')
  await page.locator('.steps:visible li').first().locator('.copy').click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'pnpm add @inlaylab/opaline @inlaylab/opaline-vue',
  )
  // Both choices survive a reload; a ?fw= link wins.
  await page.reload()
  expect(await visible().getAttribute('data-fw')).toBe('vue')
  expect(await install.textContent()).toContain('pnpm add')
  await page.goto(`${URL_}docs/?fw=angular`)
  expect(await visible().getAttribute('data-fw')).toBe('angular')
  await ctx.close()
})

test('every page links the favicon, and it is a real ICO', async () => {
  for (const path of ['', 'playground/', 'docs/', 'compare/']) {
    const html = readFileSync(`${cwd}dist/${path}index.html`, 'utf8')
    expect(html, path).toContain('href="/Opaline/favicon.ico"')
    expect(html, path).toContain('href="/Opaline/favicon.svg"')
  }
  const ico = readFileSync(`${cwd}dist/favicon.ico`)
  expect([...ico.subarray(0, 4)]).toEqual([0, 0, 1, 0])
  expect(ico.readUInt16LE(4)).toBe(3)
  const res = await fetch(`${URL_}favicon.ico`)
  expect(res.ok).toBe(true)
})

test('the demo filter shows one category at a time', async () => {
  const page = await newPage()
  await page.goto(URL_)
  const shown = () => page.locator('.demos > .demo:visible')
  const all = await shown().count()
  expect(all).toBe(10)
  await page.click('#demo-filter [data-cat="Messaging"]')
  expect(await shown().count()).toBe(2)
  for (const cat of await shown().evaluateAll((els) =>
    els.map((e) => (e as HTMLElement).dataset.cat),
  ))
    expect(cat).toBe('Messaging')
  await page.click('#demo-filter [data-cat="All"]')
  expect(await shown().count()).toBe(all)
})

test('the hero hands its seed to the playground', async () => {
  const page = await newPage()
  await page.goto(URL_)
  await page.fill('#hero-seed', 'Zoë N')
  await page.click('#hero-customize')
  await page.waitForURL(/\/playground\//)
  expect(await page.inputValue('#pg-seed')).toBe('Zoë N')
})

test('the spotlight chips dress the plush and shape the pip, big avatar and crew alike', async () => {
  const page = await newPage()
  await page.goto(URL_)
  await page.click('[data-feature="plush"] [data-value="beret"]')
  const plush = page.locator('[data-feature="plush"] opaline-avatar')
  expect(await plush.count()).toBe(7)
  for (const a of await plush.all()) expect(await a.getAttribute('accessory')).toBe('beret')
  await page.click('[data-feature="pip"] [data-value="heart"]')
  for (const a of await page.locator('[data-feature="pip"] opaline-avatar').all())
    expect(await a.getAttribute('form')).toBe('heart')
  // Seeded takes the option off again.
  await page.click('[data-feature="plush"] [data-value=""]')
  expect(await plush.first().getAttribute('accessory')).toBeNull()
})

test('the style family follows the hero seed with one hue across all seven', async () => {
  const page = await newPage()
  await page.goto(URL_)
  await page.fill('#hero-seed', 'Grace Hopper')
  expect(await page.textContent('#family-name')).toBe('Grace Hopper')
  expect(
    await page
      .locator('[data-feature="plush"] [data-feature-face] opaline-avatar')
      .getAttribute('seed'),
  ).toBe('Grace Hopper')
  const fills = await page
    .locator('.family-tile svg')
    .evaluateAll((svgs) => svgs.map((s) => /--avatar-c1, (#[0-9a-f]{6})/.exec(s.outerHTML)?.[1]))
  expect(fills).toHaveLength(7)
  expect(new Set(fills).size).toBe(1)
})
