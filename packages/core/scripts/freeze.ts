// Writes test/frozen-1.json: the checksums that lock 1.x output. Run only for a major version.
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { createAvatar } from '../src/index.ts'
import { FROZEN, FROZEN_SEEDS } from '../test/frozen-cases.ts'

const out: Record<string, string[]> = {}
for (const [name, style, sets] of FROZEN)
  for (const opts of sets)
    out[`${name} ${JSON.stringify(opts)}`] = FROZEN_SEEDS.map((seed) =>
      createHash('sha256')
        .update(createAvatar(style, { ...opts, seed }).svg)
        .digest('hex')
        .slice(0, 16),
    )
writeFileSync(
  new URL('../test/frozen-1.json', import.meta.url),
  JSON.stringify(out, null, 1) + '\n',
)
console.log(`froze ${Object.keys(out).length} cases × ${FROZEN_SEEDS.length} seeds`)
