import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { checkSsrApp } from '../../tools/ssr-e2e.ts'

test('next: server markup hydrates', () =>
  checkSsrApp({
    start: ['pnpm', 'start', '-p', '4301'],
    port: 4301,
    cwd: fileURLToPath(new URL('.', import.meta.url)),
  }))
