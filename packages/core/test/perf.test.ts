import { expect, test } from 'vitest'
import { createAvatar } from '../src/index.ts'
import { clay } from '../src/styles/clay.ts'

const pass = (offset: number) => {
  const t0 = performance.now()
  for (let i = 0; i < 500; i++)
    createAvatar(clay, { seed: `perf-${offset + i}`, finish: 'gloss', size: 32 })
  return performance.now() - t0
}

test('500 clay gloss avatars build in under 250 ms', () => {
  // Warm the JIT with one untimed pass, then keep the best of five: other test files run in
  // parallel, so a single timing measures the machine as much as the code.
  pass(10_000)
  const runs = [0, 1, 2, 3, 4].map((r) => pass(r * 500)).sort((a, b) => a - b)
  console.log(
    `500 clay gloss: best ${runs[0]!.toFixed(1)} ms, median ${runs[2]!.toFixed(1)} ms ` +
      `(${((runs[0]! / 500) * 1000).toFixed(0)} µs each)`,
  )
  // Target is 100 ms; CI fails only above 250 ms so slow shared runners do not flake.
  expect(runs[0]).toBeLessThan(250)
})
