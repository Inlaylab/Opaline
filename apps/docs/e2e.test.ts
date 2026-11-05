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

const strip = (svg: string) => svg.replace(/a[0-9a-z]{7}-/g, 'ID-')

test('the playground shows the core output for the chosen options', async () => {
  const page = await newPage()
  await page.goto(URL_)
  await page.fill('#pg-seed', 'grace@inlay.dev')
  await page.selectOption('#pg-style', 'clay')
  await page.selectOption('#pg-finish', 'gloss')
  const svg = await page
    .locator('#pg-preview svg')
    .first()
    .evaluate((e) => e.outerHTML)
  const expected = createAvatar(clay, { seed: 'grace@inlay.dev', finish: 'gloss', size: 160 }).svg
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
  await page.goto(URL_)
  await page.fill('#pg-seed', 'grace hopper')
  await page.selectOption('#pg-style', 'initials')
  await page.selectOption('#pg-shape', 'square')
  await previewMatches(
    page,
    createAvatar(initials, { seed: 'grace hopper', shape: 'square', size: 160 }).svg,
  )
  await page.fill('#pg-text', 'Op')
  await previewMatches(
    page,
    createAvatar(initials, { seed: 'grace hopper', shape: 'square', text: 'Op', size: 160 }).svg,
  )
  expect(await page.locator('#pg-code').textContent()).toContain('"text": "Op"')
})

test('every style offers every shape', async () => {
  const page = await newPage()
  await page.goto(URL_)
  await page.selectOption('#pg-style', 'morph')
  expect(await page.locator('#pg-shape-field').isVisible()).toBe(true)
  expect(await page.locator('#pg-shape option').allTextContents()).toEqual([
    'none (default)',
    'circle',
    'squircle',
    'square',
  ])
  await page.selectOption('#pg-shape', 'squircle')
  await previewMatches(
    page,
    createAvatar(morph, { seed: 'ada@inlay.dev', shape: 'squircle', size: 160 }).svg,
  )
  await page.selectOption('#pg-style', 'aura')
  expect(await page.locator('#pg-shape option').first().textContent()).toBe('circle (default)')
})

test('user input is escaped, never rendered as markup', async () => {
  const page = await newPage()
  await page.goto(URL_)
  await page.fill('#pg-seed', '<b>x</b>')
  expect(await page.locator('#pg-preview b').count()).toBe(0)
  expect(await page.locator('#pg-preview svg').count()).toBeGreaterThan(0)
  await page.fill('#pg-seed', '')
  expect(await page.locator('#pg-preview svg').count()).toBeGreaterThan(0)
})

test('copy puts the snippet on the clipboard', async () => {
  const ctx = await newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await ctx.newPage()
  await page.goto(URL_)
  await page.fill('#pg-seed', 'copy-me')
  await page.click('#pg-copy')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('copy-me')
  await ctx.close()
})

test('every snippet carries the exact seed, even with quotes, backslashes and braces', async () => {
  const page = await newPage()
  await page.goto(URL_)
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
  await page.goto(URL_)
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
  await page.goto(URL_)
  await page.selectOption('#pg-style', 'morph')
  expect(await page.locator('#pg-body-field').isVisible()).toBe(false)
  await page.selectOption('#pg-style', 'clay')
  expect(await page.locator('#pg-body-field').isVisible()).toBe(true)
  expect(await page.locator('#pg-text-field').isVisible()).toBe(false)
  await page.selectOption('#pg-style', 'initials')
  expect(await page.locator('#pg-text-field').isVisible()).toBe(true)
  expect(await page.locator('#pg-finish-field').isVisible()).toBe(false)
  expect(await page.locator('#pg-expression-field').isVisible()).toBe(false)
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
  await page.goto(`${URL_}?seed=grace+hopper&style=initials&shape=squircle&text=Op#playground`)
  expect(await page.inputValue('#pg-style')).toBe('initials')
  expect(await page.inputValue('#hero-seed')).toBe('grace hopper')
  await previewMatches(
    page,
    createAvatar(initials, { seed: 'grace hopper', shape: 'squircle', text: 'Op', size: 160 }).svg,
  )
})

test('the address bar follows the controls, and Share copies it', async () => {
  const ctx = await newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await ctx.newPage()
  await page.goto(URL_)
  // Defaults leave the address clean.
  expect(new URL(page.url()).search).toBe('')
  await page.fill('#pg-seed', 'a&b c')
  await page.selectOption('#pg-style', 'clay')
  await page.selectOption('#pg-finish', 'gloss')
  const params = new URL(page.url()).searchParams
  expect(Object.fromEntries(params)).toEqual({ seed: 'a&b c', style: 'clay', finish: 'gloss' })
  await page.click('#pg-share')
  const shared = new URL(await page.evaluate(() => navigator.clipboard.readText()))
  expect(shared.hash).toBe('#playground')
  expect(shared.searchParams.get('seed')).toBe('a&b c')
  // The copied link restores the same state in a fresh page.
  const again = await ctx.newPage()
  await again.goto(shared.href)
  expect(await again.inputValue('#pg-finish')).toBe('gloss')
  await previewMatches(again, createAvatar(clay, { seed: 'a&b c', finish: 'gloss', size: 160 }).svg)
  await ctx.close()
})

test('unknown link values are ignored', async () => {
  const page = await newPage()
  await page.goto(`${URL_}?style=constructor&size=99999&palette=%3Cb%3E`)
  expect(await page.inputValue('#pg-style')).toBe('morph')
  expect(await page.inputValue('#pg-size')).toBe('64')
  expect(await page.inputValue('#pg-palette')).toBe('')
})

test('PNG downloads a real PNG at the chosen size', async () => {
  const page = await newPage()
  await page.goto(URL_)
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
  expect(await demos.locator('[data-opaline-more]').allTextContents()).toEqual(['+5', '+3'])
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
  await page.click('.nav a[href$="#playground"]')
  await page.waitForURL(/\/Opaline\/#playground$/)
})

test('no horizontal scroll on the compare page at phone width', () =>
  expectNoHorizontalScroll('compare/'))
