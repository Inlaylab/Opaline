import { svelte } from '@sveltejs/vite-plugin-svelte'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import { ssrRender, ssrRenderGroup } from './test/ssr-command.ts'

export default defineConfig({
  plugins: [svelte()],
  test: {
    include: ['test/**/*.test.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      // Runs in Node: the server build of the component renders the markup the browser then hydrates.
      commands: { ssrRender, ssrRenderGroup },
      // CI covers all three engines; Firefox will not launch on some Windows dev machines.
      instances: (process.env.GITHUB_ACTIONS
        ? (['chromium', 'firefox', 'webkit'] as const)
        : (['chromium', 'webkit'] as const)
      ).map((browser) => ({ browser })),
    },
  },
})
