// Writes test/frozen-1.3.json: the checksums that lock the 1.3 additions. test/frozen-1.json (the
// 1.x promise) is never rewritten in 1.x: a changed 1.2 output is a bug, not a new manifest.
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { createAvatar } from '../src/index.ts'
import { FROZEN_13, FROZEN_SEEDS } from '../test/frozen-cases.ts'

const out: Record<string, string[]> = {}
for (const [name, style, sets] of FROZEN_13)
  for (const opts of sets)
    out[`${name} ${JSON.stringify(opts)}`] = FROZEN_SEEDS.map((seed) =>
      createHash('sha256')
        .update(createAvatar(style, { ...opts, seed }).svg)
        .digest('hex')
        .slice(0, 16),
    )
writeFileSync(
  new URL('../test/frozen-1.3.json', import.meta.url),
  JSON.stringify(out, null, 2) + '\n',
)
console.log(`froze ${Object.keys(out).length} cases × ${FROZEN_SEEDS.length} seeds`)
