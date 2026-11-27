import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { createAvatar } from '../src/index.ts'
import { FROZEN, FROZEN_13, FROZEN_SEEDS } from './frozen-cases.ts'

const read = (file: string): Record<string, string[]> =>
  JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'))
const digest = (svg: string) => createHash('sha256').update(svg).digest('hex').slice(0, 16)

for (const [label, cases, manifest] of [
  ['1.x', FROZEN, read('./frozen-1.json')],
  ['1.3', FROZEN_13, read('./frozen-1.3.json')],
] as const) {
  for (const [name, style, sets] of cases)
    for (const opts of sets) {
      const key = `${name} ${JSON.stringify(opts)}`
      test(`${label} output is frozen: ${key}`, () => {
        const now = FROZEN_SEEDS.map((seed) => digest(createAvatar(style, { ...opts, seed }).svg))
        const changed = FROZEN_SEEDS.filter((_, i) => now[i] !== manifest[key]?.[i])
        expect(
          changed,
          `Output changed for ${key}. The same seed and options must give the same SVG for all of 1.x; ` +
            `changing it is a breaking change that needs a major version and \`pnpm --filter @inlaylab/opaline freeze\`.`,
        ).toEqual([])
      })
    }

  test(`the ${label} frozen cases still cover everything the manifest locks`, () => {
    // Removing or renaming a case, or dropping seeds, must not quietly shrink the guarantee.
    const keys = cases.flatMap(([name, , sets]) => sets.map((o) => `${name} ${JSON.stringify(o)}`))
    expect(keys.sort()).toEqual(Object.keys(manifest).sort())
    for (const k of keys) expect(manifest[k], k).toHaveLength(FROZEN_SEEDS.length)
  })
}
