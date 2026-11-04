import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { checkSsrApp } from '../../tools/ssr-e2e.ts'

test('angular: server markup hydrates', () =>
  checkSsrApp({
    start: ['pnpm', 'start'],
    port: 4302,
    cwd: fileURLToPath(new URL('.', import.meta.url)),
  }))
