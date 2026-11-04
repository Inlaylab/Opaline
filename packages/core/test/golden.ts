import { expect, test } from 'vitest'
import { createAvatar, type Style } from '../src/index.ts'
import { SEEDS } from './seeds.ts'

/** Locks each seed's SVG to a file. Node and browser compare against the same files. */
export function goldenSuite(style: Style<any>, name: string, options: object = {}): void {
  test.each(SEEDS.map((seed, index) => ({ seed, index })))(
    `${name} #$index`,
    async ({ seed, index }) => {
      await expect(createAvatar(style, { ...options, seed }).svg).toMatchFileSnapshot(
        `./__golden__/${name}/${index}.svg`,
      )
    },
  )
}
