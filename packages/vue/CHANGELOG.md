# @inlaylab/opaline-vue

## 1.3.0

### Minor Changes

- Opaline 1.3: four new styles and a set of opt-in options. Every 1.2 seed and option set renders the same bytes.
  
  - **New styles:** `critters` (19 soft vinyl-toy animals; `animal`, `coat: 'natural' | 'palette'`), `cosmos` (15 glowing space objects; `object`, `tone`, and a night-sky tile with `shape`), `folk` (human-like people) and `doodle` (face-only line drawings). Folk and Doodle have their own expression set (18, by mood: happy, playful, attitude, moody, surprised), eleven colour looks (`scheme`), and a `square` tile by default (`shape: 'none'` drops it).
  - **Status badge:** `status: 'online' | 'away' | 'busy' | 'offline'` on every style. With `title` or `alt`, the label reads `Ada (away)`. Not drawn below 20px. Group members take their own status; a status set on the group goes to members without one. Without `title` or `alt` the status is not announced, and below 20px the label still names it though no badge is drawn.
  - **Gummy finish:** `finish: 'gummy'` on Morph, Gradient, Pip, Clay and Critters. Plush takes `material`: `gummy` (its 1.2 look, the default), `flat` or `soft`. Plush still ignores `finish`, as in 1.2, so a finish shared across looks never changes it.
  - **More, by name only:** eight expressions (`starry`, `love`, `laugh`, `cool`, `nice`, `smug`, `yawn`, `wow`), Gradient `form` (nine smooth outlines), Morph families `star`, `drop`, `bloom`, Pip forms `star`, `clover`, `shield`, `octagon`, `ghost`, Clay `body: 'ghost'` and `ears: 'fox' | 'mouse'`, Plush `accessory: 'pumpkin' | 'party' | 'headphones' | 'crown'`. Seeds never land on them unless you set them.
  - **Wrappers** take every new style and option. `LookOptions` (core) is the shared props type.
  - **Wider types:** `Expression`, `Family`, `Finish`, `Accessory`, `PipForm` and Clay `body` and `ears` gained values. Code that switches over every value or uses `Record<Expression, …>` needs the new keys.

### Patch Changes

- Updated dependencies
  - @inlaylab/opaline@1.3.0

## 1.2.0

### Patch Changes

- New `accessory` and `form` options for the Plush and Pip styles.
- Updated dependencies
  - @inlaylab/opaline@1.2.0

## 1.1.2

### Patch Changes

- @inlaylab/opaline@1.1.2

## 1.1.1

### Patch Changes

- New `AvatarGroup`: overlapping avatars with a `+N` chip past `max`. Members are seeds or `{ seed, src, alt }`. SSR safe.
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
