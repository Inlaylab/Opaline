import { spawn, spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createAvatar } from '@inlaylab/opaline'
import { clay } from '@inlaylab/opaline/clay'
import { chromium, type Browser } from 'playwright'
import { afterAll, beforeAll, expect, test } from 'vitest'

const cwd = fileURLToPath(new URL('.', import.meta.url))
const PORT = 4320
const URL_ = `http://localhost:${PORT}/Opaline/`
let server: ReturnType<typeof spawn>
let browser: Browser

// Astro runs preview as a daemon: stop any earlier one so the test never hits a stale build.
const stopPreview = () =>
  spawnSync('pnpm', ['exec', 'astro', 'preview', 'stop'], { cwd, stdio: 'ignore' })

beforeAll(async () => {
  stopPreview()
  server = spawn('pnpm', ['exec', 'astro', 'preview', '--port', String(PORT)], {
    cwd,
    detached: true,
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
  try {
    process.kill(-server.pid!, 'SIGTERM')
  } catch {}
  stopPreview()
})

const strip = (svg: string) => svg.replace(/a[0-9a-z]{7}-/g, 'ID-')

test('the playground shows the core output for the chosen options', async () => {
  const page = await browser.newPage()
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

test('user input is escaped, never rendered as markup', async () => {
  const page = await browser.newPage()
  await page.goto(URL_)
  await page.fill('#pg-seed', '<b>x</b>')
  expect(await page.locator('#pg-preview b').count()).toBe(0)
  expect(await page.locator('#pg-preview svg').count()).toBeGreaterThan(0)
  await page.fill('#pg-seed', '')
  expect(await page.locator('#pg-preview svg').count()).toBeGreaterThan(0)
})

test('copy puts the snippet on the clipboard', async () => {
  const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await ctx.newPage()
  await page.goto(URL_)
  await page.fill('#pg-seed', 'copy-me')
  await page.click('#pg-copy')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('copy-me')
  await ctx.close()
})

test('the theme toggle persists across reloads', async () => {
  const page = await browser.newPage({ colorScheme: 'light' })
  await page.goto(URL_)
  await page.click('#theme-toggle')
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
  await page.reload()
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
})

test('style-specific controls hide for other styles', async () => {
  const page = await browser.newPage()
  await page.goto(URL_)
  await page.selectOption('#pg-style', 'morph')
  expect(await page.locator('#pg-body-field').isVisible()).toBe(false)
  await page.selectOption('#pg-style', 'clay')
  expect(await page.locator('#pg-body-field').isVisible()).toBe(true)
})

test('no horizontal scroll at phone width', async () => {
  const page = await browser.newPage({ viewport: { width: 375, height: 800 } })
  await page.goto(URL_)
  const [sw, cw] = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    document.documentElement.clientWidth,
  ])
  expect(sw).toBeLessThanOrEqual(cw)
})

test('built HTML only references assets under the Pages base', () => {
  const html = readdirSync(`${cwd}dist`)
    .filter((f) => f.endsWith('.html'))
    .map((f) => readFileSync(`${cwd}dist/${f}`, 'utf8'))
    .join('')
  expect(html).not.toMatch(/(?:src|href)="\/(?!Opaline\/)[^/"]/)
})
