import { expect, test } from 'vitest'
import { createAvatar, type Style } from '../src/index.ts'
import { aura } from '../src/styles/aura.ts'
import { clay } from '../src/styles/clay.ts'
import { gradient } from '../src/styles/gradient.ts'
import { initials } from '../src/styles/initials.ts'
import { morph } from '../src/styles/morph.ts'
import { pip } from '../src/styles/pip.ts'
import { plush } from '../src/styles/plush.ts'

const STYLES: Style<any>[] = [morph, gradient, aura, clay, initials, plush, pip]
const seeds = Array.from({ length: 60 }, (_, i) =>
  i % 3 ? `person-${i}@example.com` : `Name ${String.fromCharCode(65 + (i % 26))} ${i}`,
)

test('every style gives a seed the same hue, so one user keeps one color across looks', () => {
  for (const palette of ['vivid', 'pastel', 'warm', 'mono'] as const)
    for (const seed of seeds) {
      const hues = STYLES.map((s) => createAvatar(s, { seed, palette }).toJSON().hue)
      expect(new Set(hues).size, `${seed} / ${palette}: ${hues}`).toBe(1)
    }
})

test('every style paints the same body color for a seed', () => {
  // --avatar-c1 is the body in every style.
  const fill = (svg: string) => /--avatar-c1, (#[0-9a-f]{6})/.exec(svg)?.[1]
  for (const seed of seeds.slice(0, 20)) {
    const colors = STYLES.map((s) => fill(createAvatar(s, { seed, face: false } as never).svg))
    expect(new Set(colors).size, `${seed}: ${colors}`).toBe(1)
  }
})
