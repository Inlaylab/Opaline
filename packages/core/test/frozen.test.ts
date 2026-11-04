import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { createAvatar } from '../src/index.ts'
import { FROZEN, FROZEN_SEEDS } from './frozen-cases.ts'

const manifest: Record<string, string[]> = JSON.parse(
  readFileSync(new URL('./frozen-1.json', import.meta.url), 'utf8'),
)
const digest = (svg: string) => createHash('sha256').update(svg).digest('hex').slice(0, 16)

for (const [name, style, sets] of FROZEN)
  for (const opts of sets) {
    const key = `${name} ${JSON.stringify(opts)}`
    test(`1.x output is frozen: ${key}`, () => {
      const now = FROZEN_SEEDS.map((seed) => digest(createAvatar(style, { ...opts, seed }).svg))
      const changed = FROZEN_SEEDS.filter((_, i) => now[i] !== manifest[key]?.[i])
      expect(
        changed,
        `Output changed for ${key}. The same seed and options must give the same SVG for all of 1.x; ` +
          `changing it is a breaking change that needs a major version and \`pnpm freeze\`.`,
      ).toEqual([])
    })
  }
