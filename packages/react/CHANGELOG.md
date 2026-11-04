# @inlaylab/opaline-react

## 1.0.0

### Major Changes

- 1.0: stable output. The same seed and options now give a byte-identical SVG for every 1.x release, guarded by a checksum file in CI. Options set to their default give exactly the unset output, including gradient IDs, in every style. Every package now ships a README, the MIT license and full npm metadata.

### Patch Changes

- Updated dependencies
  - @inlaylab/opaline@1.0.0

## 0.4.0

### Minor Changes

- Clay style with `jelly` and `hood` bodies, `soft` and `gloss` finishes for Morph, Gradient and Clay, and Clay support in every wrapper. Morph and Gradient output is unchanged from 0.2.

### Patch Changes

- Updated dependencies
  - @inlaylab/opaline@0.4.0

## 0.3.0

### Minor Changes

- Vue and Svelte wrappers that pass the shared contract suite, and SSR sample apps for Next, Angular SSR, Nuxt and SvelteKit.

### Patch Changes

- Updated dependencies
  - @inlaylab/opaline@0.3.0

## 0.2.0

### Minor Changes

- Blob family: Aura, Morph and Gradient styles (`@inlaylab/opaline/aura`, `/morph`, `/gradient`), a seeded shape genome, 12 curated expressions and OKLCH palettes. New wrappers: `<opaline-avatar>` custom element, React `Avatar`, Angular `op-avatar`. All share one contract: image fallback, accessible name from `alt`, and unique gradient IDs per instance.

### Patch Changes

- Updated dependencies
  - @inlaylab/opaline@0.2.0
