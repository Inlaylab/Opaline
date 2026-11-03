import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    morph: 'src/styles/morph.ts',
    gradient: 'src/styles/gradient.ts',
    aura: 'src/styles/aura.ts',
  },
  format: 'esm',
  platform: 'neutral',
  dts: true,
  clean: true,
})
