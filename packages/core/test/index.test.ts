import { expect, test } from 'vitest'
import { VERSION } from '../src/index.ts'

test('exports a version', () => {
  expect(typeof VERSION).toBe('string')
})
