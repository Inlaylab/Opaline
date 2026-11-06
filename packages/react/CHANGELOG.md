# @inlaylab/opaline-react

## 1.1.2

### Patch Changes

- Support React 18 (peer `react >=18`) and Angular 20 to 22 (peer `@angular/core >=20 <23`). Component output is unchanged. With React 18, use `@types/react` 18.2.6 or later.
- @inlaylab/opaline@1.1.2

## 1.1.1

### Patch Changes

- New `AvatarGroup`: overlapping avatars with a `+N` chip past `max`. Members are seeds or `{ seed, src, alt }`. Server-component safe.
- Initials are easier to read: the letters are now a deep shade of the tile's own hue, chosen to clear WCAG AA (4.5:1) on every palette. White letters on 1.1.0's bright tiles were as low as 1.9:1. Only the letter color changes, and pastel tiles keep their 1.1.0 output. `--avatar-fg` still overrides it.
- Hotfix: remove the `ellipse` shape. `shape` takes `circle`, `squircle` or `square`. `shape: 'ellipse'` now falls back like any unknown value: a circle on Aura and Initials, and no tile on Morph, Gradient and Clay. 1.0 output is unchanged.
- Updated dependencies
  - @inlaylab/opaline@1.1.1

## 1.1.0

### Minor Changes

- New `initials` style (`@inlaylab/opaline/initials`): the person's initials on a seeded tile, taken from the seed or set with `text`. Every style now takes `shape`: `circle`, `squircle`, `square` or `ellipse`. Aura and Initials draw their tile in that shape; Morph, Gradient and Clay draw a tinted tile behind the character. Leaving `shape` unset gives exactly the 1.0 output.

### Patch Changes

- Updated dependencies
  - @inlaylab/opaline@1.1.0

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
