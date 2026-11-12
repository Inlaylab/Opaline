// Backs the site's "100,000 users, 100,000 different avatars" claim: draws N avatars per style from
// N different seeds and counts distinct SVGs. The ceiling is the 32-bit seed hash (about 4.3 billion
// faces per style), so expect about N² / 2³³ repeats: ~1 at 100,000, ~116 at 1,000,000. `pnpm --filter @inlaylab/opaline uniqueness [N]`.
import { createHash } from 'node:crypto'
import { createAvatar, type Style } from '../src/index.ts'
import { aura } from '../src/styles/aura.ts'
import { clay } from '../src/styles/clay.ts'
import { gradient } from '../src/styles/gradient.ts'
import { initials } from '../src/styles/initials.ts'
import { morph } from '../src/styles/morph.ts'
import { pip } from '../src/styles/pip.ts'
import { plush } from '../src/styles/plush.ts'

const N = Number(process.argv[2] ?? 100_000)
const STYLES: Style<any>[] = [morph, gradient, aura, clay, plush, pip, initials]
// Seeds shaped like real ones: emails, display names and opaque IDs.
const seed = (i: number) =>
  i % 3 === 0
    ? `user${i}@example.com`
    : i % 3 === 1
      ? `Person ${i}`
      : `id_${((i * 2654435761) >>> 0).toString(36)}`

let ok = true
for (const style of STYLES) {
  const seen = new Set<string>()
  for (let i = 0; i < N; i++)
    seen.add(
      createHash('sha1')
        .update(createAvatar(style, { seed: seed(i) }).svg)
        .digest('base64'),
    )
  ok &&= seen.size === N
  console.log(
    `${style.name.padEnd(9)} ${seen.size.toLocaleString('en')} distinct of ${N.toLocaleString('en')}`,
  )
}
process.exit(ok ? 0 : 1)
