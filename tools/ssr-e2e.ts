import { spawn } from 'node:child_process'
import { expect } from 'vitest'
import { chromium } from 'playwright'

export { PIXEL } from './ssr-e2e-pixel.ts'

type Options = {
  /** Command and arguments that start the built production server. */
  start: string[]
  port: number
  cwd: string
  env?: Record<string, string>
}

async function waitForServer(url: string, alive: () => boolean, ms = 30_000): Promise<string> {
  const end = Date.now() + ms
  for (;;) {
    try {
      const res = await fetch(url)
      if (res.ok) return await res.text()
    } catch {}
    if (!alive()) throw new Error(`server exited before answering at ${url}`)
    if (Date.now() > end) throw new Error(`server did not answer at ${url}`)
    await new Promise((r) => setTimeout(r, 250))
  }
}

/**
 * Every sample page renders the same two avatars: `ada@inlay.dev` with `gradient`, once with
 * `src={PIXEL}` and `alt="Ada"`, once plain. This checks the server HTML and the hydrated page.
 */
export async function checkSsrApp({ start, port, cwd, env = {} }: Options): Promise<void> {
  const [command, ...args] = start
  const server = spawn(command!, args, {
    cwd,
    env: { ...process.env, PORT: String(port), ...env },
    stdio: 'inherit',
    detached: true,
  })
  const browser = await chromium.launch()
  try {
    const url = `http://localhost:${port}/`
    const html = await waitForServer(url, () => server.exitCode === null)

    // Server HTML: two avatars, the named one carries the a11y contract, and no id repeats.
    // `data-opaline` and `data-opaline=""` are the same attribute; Vue writes the short form.
    expect(html.match(/\sdata-opaline(?:=""|(?=[\s>]))/g)).toHaveLength(2)
    expect(html.match(/<svg/g)?.length).toBeGreaterThanOrEqual(2)
    expect(html).toMatch(/role="img"[^>]*aria-label="Ada"|aria-label="Ada"[^>]*role="img"/)
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)

    // Hydrated page: no hydration complaints or errors, and the loaded photo shows.
    const page = await browser.newPage()
    const problems: string[] = []
    page.on('console', (m) => {
      if (/hydrat/i.test(m.text()) || m.type() === 'error') problems.push(m.text())
    })
    page.on('pageerror', (e) => problems.push(String(e)))
    await page.goto(url, { waitUntil: 'networkidle' })
    const named = page.locator('[data-opaline][aria-label="Ada"]')
    await expect
      .poll(() => named.locator('img').evaluate((img: HTMLImageElement) => img.hidden))
      .toBe(false)
    expect(await page.locator('[data-opaline] svg').count()).toBeGreaterThanOrEqual(2)
    expect(problems).toEqual([])
    // Production Svelte repairs a mismatch silently, so also compare the hydrated DOM with the
    // server HTML: each avatar's root attributes and svg must be what the server sent.
    const hydrated = await page.locator('[data-opaline]').evaluateAll((roots) =>
      roots.map((root) => ({
        attrs: [...root.attributes]
          // Angular's hydration marker; it removes it once hydration is done.
          .filter((a) => a.name !== 'ngh')
          .map((a) => `${a.name}=${a.value}`)
          .sort(),
        svg: root.querySelector('svg')?.outerHTML,
      })),
    )
    const served = await page.evaluate((source) => {
      const doc = new DOMParser().parseFromString(source, 'text/html')
      return [...doc.querySelectorAll('[data-opaline]')].map((root) => ({
        attrs: [...root.attributes]
          // Angular's hydration marker; it removes it once hydration is done.
          .filter((a) => a.name !== 'ngh')
          .map((a) => `${a.name}=${a.value}`)
          .sort(),
        svg: root.querySelector('svg')?.outerHTML,
      }))
    }, html)
    expect(hydrated).toEqual(served)
  } finally {
    await browser.close()
    // The server may have started children; end the whole group.
    try {
      process.kill(-server.pid!, 'SIGTERM')
    } catch {}
  }
}
