import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { checkSsrApp } from '../../tools/ssr-e2e.ts'

test('sveltekit: server markup hydrates', () =>
  checkSsrApp({
    start: ['pnpm', 'start'],
    port: 4304,
    cwd: fileURLToPath(new URL('.', import.meta.url)),
  }))
