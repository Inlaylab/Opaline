# Changelog

Each release has a `## X.Y.Z (YYYY-MM-DD)` heading, a one-line title, then the notes. All six packages share one version number.

Changesets writes the per-package notes in `packages/*/CHANGELOG.md`. The docs site's changelog page reads `packages/core/CHANGELOG.md` and the short summaries in `apps/docs/src/data/releases.ts`. This file collects the notes for every package in one place.

Within 1.x, the same seed and options draw the same SVG, byte for byte. The one exception is listed under 1.1.1.

## 1.3.0 (unreleased)

Four new styles, a status badge and a gummy finish.

Packages: `@inlaylab/opaline`, `-react`, `-vue`, `-svelte`, `-angular` and `-element` 1.3.0. Every 1.2 seed and option set renders the same bytes. Everything new appears only when you ask for it.

### New

- `critters`: 19 soft vinyl-toy animals. Set `animal`, and `coat: 'palette'` to colour the fur from the seed instead of the natural coat. Faces are jolly unless you set a `mood`.
- `cosmos`: 15 glowing space objects. Set `object`, `tone` for one of the object's colour themes, and `shape` for a night-sky tile. The face keeps its colour in every theme.
- `folk` (people, head and shoulders) and `doodle` (face-only line drawings). They have their own 18 expressions, sorted into the moods `happy`, `playful`, `attitude`, `moody` and `surprised`, and 11 colour looks through `scheme`. Both sit on a `square` tile by default; `shape: 'none'` removes it.
- `status: 'online' | 'away' | 'busy' | 'offline'` draws a presence badge on every style. With `title` or `alt`, the label reads `Ada (away)`.
- `finish: 'gummy'` on Morph, Gradient, Pip, Clay and Critters: the jelly look Plush has had since 1.2.
- Plush `material`: `gummy` (the default and the 1.2 look), `flat` or `soft`.
- Values you can only set by name, never drawn by a seed: eight expressions (`starry`, `love`, `laugh`, `cool`, `nice`, `smug`, `yawn`, `wow`), nine Gradient `form` outlines, Morph families `star`, `drop` and `bloom`, Pip forms `star`, `clover`, `shield`, `octagon` and `ghost`, Clay `body: 'ghost'` and `ears: 'fox' | 'mouse'`, and the Plush hats `pumpkin`, `party`, `headphones` and `crown`.
- `LookOptions` in the core: one props type with every option of every style, for wrappers and your own components.

### Changed

- Plush still ignores `finish`, as in 1.2, so a finish you share across looks never changes Plush. Use `material` for Plush.
- Bundles for the older styles are larger, because the new faces, the gummy finish, Gradient forms and the status badge ship with every style. Gzipped, from 1.2: core 1.27 to 1.58 KB, core + morph 4.91 to 6.61 KB, core + gradient 5.14 to 7.42 KB, core + clay 5.58 to 7.60 KB, core + plush 6.71 to 8.88 KB, core + pip 4.34 to 5.35 KB. The [roadmap](ROADMAP.md) has the plan to bring them back down.
- Wider types: `Expression`, `Family`, `Finish`, `Accessory`, `PipForm` and Clay `body` and `ears` take new values. A `switch` that covers every value, or a `Record<Expression, …>`, needs the new keys.

### Improvements

- Every wrapper takes every new style and option.
- React, Vue and Svelte groups pass each member's `status`. A `status` set on the group goes to members that have none.
- Cosmos `tone` also takes a numeric string, so `tone="1"` works as a plain attribute in Vue and Angular. An empty `tone` on the web component lets the seed pick.
- The docs site has a new look, a canvas-and-inspector playground, a styles page and a changelog page written for people.

### Fixes

- The README's support section named the wrong project.

## 1.2.0 (2026-11-12)

Plush and Pip.

### New

- `plush`: gummy critters, with a clear-looking body that sags into drips, a few bubbles inside, a face and a seeded `accessory` (`beret`, `cap`, `beanie`, `glasses`, `shades`, `flower`, `sprout`, `bow`, `star` or `none`).
- `pip`: bold geometric forms with two pill eyes. `form` is `circle`, `squircle`, `triangle`, `hexagon`, `diamond`, `heart`, `drop`, `pill` or `dome`.
- Both keep the seed's colour, so a user stays one colour across styles. Every wrapper accepts `accessory` and `form`.

## 1.1.2 (2026-11-06)

Wider framework support.

### Improvements

- The wrappers work with React 18 and Angular 20 to 22. The core is unchanged.

## 1.1.1 (2026-11-06)

Readable initials, PNG export and groups.

### New

- `@inlaylab/opaline/png`. In the browser, `toPng(avatar, { size, vars })` returns a PNG `Blob` with no dependencies. On a server, `forRaster(avatar, { size, vars })` prepares the SVG for a rasterizer such as resvg.
- `avatarGroup(members, { max, size, shape })`: the layout behind every wrapper's avatar group, with a `+N` chip past `max`.
- `contrast(a, b)` returns the WCAG contrast ratio of two hex colours.

### Changed

- Initials letters are a deep shade of the tile's hue, at least 4.5:1 on every palette. On 1.1.0's bright tiles the white letters went as low as 1.9:1. This is the one deliberate output change in 1.x: only the `<text>` colour changed, and pastel tiles are unchanged. `--avatar-fg` still overrides it.

### Fixes

- The `ellipse` shape is gone. `shape` takes `circle`, `squircle` or `square`, and any other value falls back like an unknown one. 1.0 output is unchanged.

## 1.1.0 (2026-11-04)

Initials and shapes.

### New

- `initials` (`@inlaylab/opaline/initials`): the person's initials from the seed, or from `text`.
- `shape` on every style. Leaving it unset gives exactly the 1.0 output.

## 1.0.0 (2026-11-04)

Stable output.

### Improvements

- The same seed and options give a byte-identical SVG in every 1.x release. A checksum file in CI guards it.
- An option set to its default gives exactly the unset output, gradient IDs included.
- Every package ships a README, the MIT license and full npm metadata.

## 0.4.0

Clay.

### New

- `clay`, with `jelly` and `hood` bodies, in every wrapper.
- `soft` and `gloss` finishes for Morph, Gradient and Clay. Morph and Gradient output is unchanged from 0.2.

## 0.3.0

Vue and Svelte.

### New

- Vue and Svelte wrappers that pass the shared contract suite.
- SSR sample apps for Next, Angular SSR, Nuxt and SvelteKit.

## 0.2.0

The blob family.

### New

- Aura, Morph and Gradient, a seeded shape genome, 12 expressions and OKLCH palettes.
- The `<opaline-avatar>` custom element, React `Avatar` and Angular `op-avatar`. They share image fallback, an accessible name from `alt` and unique gradient IDs.

## 0.1.0

Foundation: the seeded core, an SVG builder, OKLCH colour and golden tests.
