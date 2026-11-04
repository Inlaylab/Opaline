import { defineConfig } from 'vitest/config'

/** The 500-avatar timing, run on its own after the other suites so they do not share the CPU. */
export default defineConfig({
  test: { name: 'perf', include: ['test/perf.test.ts'], fileParallelism: false },
})
