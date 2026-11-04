import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'neutral',
  // One file per module, so the 'use client' directive stays on the image module only.
  unbundle: true,
  dts: true,
  clean: true,
})
