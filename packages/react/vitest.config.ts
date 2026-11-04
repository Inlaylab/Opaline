import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.tsx'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      // CI covers all three engines; Firefox will not launch on some Windows dev machines.
      instances: (process.env.GITHUB_ACTIONS
        ? (['chromium', 'firefox', 'webkit'] as const)
        : (['chromium', 'webkit'] as const)
      ).map((browser) => ({ browser })),
    },
  },
})
