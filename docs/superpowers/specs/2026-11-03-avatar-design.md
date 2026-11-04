# Opaline — design

Name: **Opaline**. Repo `Inlaylab/opaline`. Core package `@inlaylab/opaline`, others `@inlaylab/opaline-<framework>`. Custom element `<opaline-avatar>`.

## Intent

This is an open-source library that makes avatars from a seed. The same seed, such as a user ID, email or name, always gives the same avatar. Its main job is default profile pictures.

The look must be intuitive, modern and clean. It takes ideas from the references in `Avatar ref/` but copies none of them.

## Goals

1. **Native components** for every major framework:
   - Web Component, React and Angular first.
   - Vue and Svelte next.
2. **One license (MIT)** for all code and all art. All art is drawn as code in this repo.
3. **Theming through CSS variables.** Avatars follow the app theme and dark mode, including Ivorie and shadcn tokens.
4. **Small size.**
   - The core has zero runtime dependencies.
   - Each style is its own subpath import.
5. **Deterministic output.** From 1.0, the same seed gives the same SVG until the next major version.

## Non-goals (v1)

- PNG or raster 3D packs; Memoji-level realism.
- A hosted SaaS. We ship a self-hosted Docker API only.
- A Figma plugin.
- An end-user avatar editor.
- Initials.
- Ports to other languages.
- Critter, which comes after 1.0.

## Anti-goals

The project fails, even if it works, if any of these happens:

- The same seed gives a different avatar after a minor release.
- Two avatars on one page break each other's gradients through an ID clash.
- Any art is not MIT.
- The core gets a runtime dependency.
- A face looks creepy or uncanny.
- Our output looks like a copy of Blobz, Boring Avatars or DiceBear.

## Prior art and gaps

- **Blobz:**
  - React only.
  - Has a named catalog of shapes, eyes and mouths.
  - Users pick eyes and mouth one by one, which can give odd faces.
- **Boring Avatars:**
  - React only.
  - Faceless.
  - Uses SVG filters, which are slow in long lists.
- **DiceBear:**
  - No real framework components.
  - Each style has its own license.
  - Output can change between versions.

## Signature traits (what makes ours unique)

1. **Shape genome.**
   - A blob is built from continuous seeded values: lobe count (1–7), roundness, wobble and squash.
   - The points are smoothed with Catmull-Rom into cubic Béziers.
   - There is no shape catalog. Anchor families (`egg`, `duo`, `tri`, `clover`, `petal`, `cushion`) are only labels for the Studio.
2. **Face on the visual center.** The face sits at the center of roughly the largest circle that fits inside the shape, never on a thin lobe.
3. **Curated expressions.**
   - There are 12 named expressions. Each is a hand-checked set of eyes, mouth, blush and brow:
     `beam`, `content`, `curious`, `cheeky`, `dreamy`, `wink`, `oh`, `hmm`, `proud`, `shy`, `sleepy`, `giggle`.
   - `mood` (happy, calm, surprised, playful) narrows which expressions can come up.
   - Users never pick eyes and mouth one by one.
4. **Two-dot catch-light.** Every eye has one large and one small highlight, both toward the top-left.
5. **One light source**, at the top-left, for shading, highlights and the contact shadow.
6. **OKLCH color.**
   - Shades come from the base color in OKLCH.
   - Colors come out as `var(--avatar-cN, #hex)`.
   - `colors: 'theme'` maps them to `--primary`, `--accent` and `--chart-1..5`.

## Styles (v1)

| Style    | Face                      | Look                                                                                                      | Budget (gzip) |
| -------- | ------------------------- | --------------------------------------------------------------------------------------------------------- | ------------- |
| Aura     | never                     | Circle or squircle with 2–4 OKLCH radial gradients at seeded points, plus a soft light sweep. No filters. | ≤1 KB         |
| Morph    | default on, `face: false` | Shape genome, solid fill, face kit                                                                        | ≤2 KB         |
| Gradient | default on, `face: false` | Shape genome, mesh fill (layered radial gradients), face kit                                              | ≤2 KB         |

Budgets are measured as `createAvatar` plus the style import, since the shape genome and face kit ship with the blob styles rather than the core entry. Limits: core 3 KB, core + Aura 4 KB, core + Morph 5 KB, core + Gradient 5 KB. The Angular wrapper is measured as partial-compiled code (2 KB); the other wrappers 1.5 KB.
| Clay | yes | `soft`/`gloss` finish. Bodies: `jelly` (genome plus nub arms), `hood` (animal-ear hood) | ≤8 KB |
| Persona | yes | Parametric people: head, hair, brows, eyes, mouth, glasses, earrings, top. Circle backdrop with dots. Finish is `flat` or `soft`. | ≤20 KB |

Assumption: Morph and Gradient show a face by default. If they should be faceless by default, change one default.

## Layers

`backdrop → body → fill → face → finish`. A style is a preset that picks from each layer.

- **Backdrop:** `none` | `solid` | `mesh` | `dots`.
- **Fill:** `solid` | `mesh` | `shade`.
- **Finish:** `flat` | `soft` | `gloss`. Gradients only, never SVG filters.
- **Shape (clip):** `circle` | `squircle` | `square`.
- **Presets** are named bundles of options. Palettes: `pastel`, `vivid`, `electric`, `muted`, `warm`, `cool`, `mono`, `theme`.

## API

```ts
createAvatar(morph, { seed: 'ada@inlay.dev' }).svg
createAvatar(clay, { seed, body: 'hood', mood: 'happy', size: 96 })
createAvatar(aura, { seed, palette: 'cool', shape: 'squircle' }).toJSON()
```

- Shared options: `seed`, `size`, `shape`, `mood`, `face`, `finish`, `palette`, `colors` and `backdrop`, plus each style's own options.
- Wrappers add `look`, `src` and `alt`.
- Any option you set fixes that layer, and the seed fills in the rest.
- `toJSON()` returns the resolved picks.

## Rules

- **Seed.** The seed is trimmed, put in NFC form and lower-cased when it is an email. The xmur3 hash seeds an sfc32 PRNG.
- **Pick order.** Each layer takes its picks in a fixed order, so adding an option never shifts the other picks.
- **IDs.** Gradient IDs are prefixed with a hash of the seed, the style name and the resolved options. Two avatars with the same seed but different options can sit on one page without an ID clash. `Math.random` is never used. When one page shows the same avatar twice, the wrapper passes an `instance` option (React `useId`, an Angular root counter like Ivorie `IvIdGenerator`, an element counter). It is appended to every ID and is not part of the hash, so the picks never change.
- **Escaping.** The seed and `alt` are escaped before they go into the SVG. Only our own parts go into the SVG.
- **Component contract** (the same in every framework):
  - The generated SVG shows while `src` loads, and stays if `src` fails.
  - With `alt`: `role="img"` and an `aria-label`. Without `alt`: `aria-hidden`.
  - SSR needs no DOM, and hydration does not change the markup.
- **Ivorie.** The Angular package must work inside `<iv-avatar-fallback>` (`ivorie/projects/ui/avatar/avatar.ts`).

## Art as code

- Every part is a TypeScript function that returns path data. Claude draws all parts.
- **Design gate.** Before 0.2, 0.4 and 0.5, a throwaway design sheet must be approved:
  - a 100-seed grid at 24, 48 and 128px,
  - light and dark theme,
  - shown side by side with the references.

## Approaches considered

- **Rendering:**
  - SVG built as strings (chosen): SSR-safe, the same in every framework, small.
  - Canvas or PNG was rejected: no theming, no SSR markup.
- **Art source:**
  - Code-drawn parametric parts (chosen): clean MIT, small, editable.
  - Figma-drawn art was rejected: needs an artist and an extra pipeline.
  - A contract artist was rejected: needs a copyright assignment.
- **Monorepo tooling:**
  - pnpm and Turborepo (chosen): many framework builds.
  - An Angular CLI workspace like Ivorie was rejected: Angular only.
- **3D look:**
  - Faked in SVG gradients (chosen).
  - Raster layers were rejected: not themeable and large.

## Packaging

```
packages/core       createAvatar, normalize, hash+PRNG, shape genome, inscribed center, face kit,
                    fills, finishes, OKLCH color, SVG builder, IDs, escaping, toJSON
                    styles ship as subpaths of the core package: @inlaylab/opaline/aura, /morph, /gradient …
packages/element    <opaline-avatar> custom element, no Lit
packages/react      RSC-safe SVG + 'use client' image fallback
packages/angular    standalone, signal inputs, zoneless, SSR-safe (ng-packagr)
packages/vue        Vue 3
packages/svelte     Svelte 5 runes
packages/cli        generate SVG/PNG/WebP (@resvg/resvg-js; CSS vars resolved to hex)
apps/api            Hono, Dockerfile, ETag = seed hash, Cache-Control immutable
apps/docs           Astro + framework islands; Studio (Design / JSON / SVG tabs)
registry/           shadcn registry + Ivorie CLI entry
```

- Packages are ESM only, with `types` and `sideEffects: false`. The exception is `element`, which registers the tag.
- Tooling:
  - pnpm workspaces, Turborepo, and Changesets in fixed mode.
  - Vitest for tests.
  - tsdown for builds, and ng-packagr for the Angular package.
  - size-limit, publint and attw for package checks.
- Repo rules follow Ivorie:
  - One phase = one minor release = one PR.
  - Conventional Commits, with no AI attribution lines.
  - Ask before every npm publish.

## Phases

| Release | Content                                                                                                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0.1     | Foundation: repo, CI, MIT license; core normalize, hash, PRNG, SVG builder, IDs, escaping, OKLCH; golden harness; size-limit                                                               |
| 0.2     | Design gate. Shape genome, inscribed center, face kit, fills, `flat` finish. Aura, Morph, Gradient. Web Component, React, Angular, and the contract suite. Docs page with a 100-seed grid. |
| 0.3     | Vue and Svelte. SSR sample apps: Next, Angular SSR, Nuxt, SvelteKit.                                                                                                                       |
| 0.4     | Design gate. `soft`/`gloss` finishes. Clay `jelly` and `hood`. A 500-avatar perf check.                                                                                                    |
| 0.5     | Design gate. Persona.                                                                                                                                                                      |
| 0.6     | CLI, HTTP API, Docker.                                                                                                                                                                     |
| 1.0     | Studio, shadcn and Ivorie registries, final name, freeze seed output.                                                                                                                      |

## Verification

- `pnpm turbo run build test lint` passes.
- Golden SVGs (50 seeds per style) are byte-identical on Node and in the browser.
- size-limit stays within budget.
- Contract and SSR tests pass for every shipped wrapper.
- Two avatars with the same seed on one page have no ID clash.
- Each design gate sheet is approved.
- From 0.6, the API output is byte-identical to the core output.

## Left to the builder

- How the inscribed center is approximated (a grid sample or a pole of inaccessibility), within the core budget.
- The exact genome ranges and the expression geometry, tuned at the design gate.
- Palette hex values, checked for contrast in light and dark.

## Locked design (0.2 gate, approved 2026-11-03)

The reference implementation is [docs/design/gate-0.2.html](../../design/gate-0.2.html). The core reproduces its geometry and numbers exactly, so 0.2 output looks like the approved sheet. That file is a sketch; the core is the source of truth once it ships.

- **Shape genome.**
  - 72 radial samples: `r = 1 + amp·cos(L·(t − phase)) + Σ wobble(k = 2, 3, 5, |a| ≤ 0.035)`, where a wobble term is skipped when its k equals L.
  - x is scaled by `sx` (0.92–1.08) and y by `1/sx`. The shape is fit into 8..92.
  - Every 3rd sample feeds a closed Catmull-Rom curve, which is turned into cubic Béziers.
  - Families:

    | Family  | L   | amp        | phase  |
    | ------- | --- | ---------- | ------ |
    | egg     | 1   | 0.05–0.1   | π/2    |
    | duo     | 2   | 0.07–0.12  | seeded |
    | tri     | 3   | 0.08–0.12  | −π/2   |
    | cushion | 4   | 0.035–0.06 | π/4    |
    | clover  | 4   | 0.15–0.2   | seeded |
    | petal   | 5–6 | 0.13–0.17  | seeded |

    Every phase gets ±0.18 of jitter.
- **Face placement.**
  - The inscribed center comes from a 16×16 grid over 10..90, then a 10×10 refine pass over ±5.
  - The face is placed at `(x, y − 0.08·r)` with scale `clamp(r/22, 0.5, 1.2)`.
  - Rotation is ±7°, and eye spread is `11 + (−1..1.2)`.
- **Face parts.**
  - Eyes: `round` (white r 7.2 with pupil r 4.4), `dot` (r 5.4), `arc`, `lid`.
  - Mouths: `smile`, `small`, `flat`, `cat`, `o`, `grin` (with tongue), `tongue`.
  - Brows: `raise` and `flat`. Blush: ellipses at opacity 0.5.
  - Catch-lights: r 0.34 at (−0.32, −0.32), and r 0.15 at (0.18, −0.55), both times the pupil radius.
  - Ink is `oklch(0.24 0.035 bodyHue)`. Tongue is `oklch(0.68 0.16 15)`. Blush is `oklch(0.72 0.15 8)`.
- **Expressions and moods.**
  - happy: beam, content, proud.
  - calm: dreamy, hmm, shy, sleepy.
  - surprised: curious, oh.
  - playful: cheeky, wink, giggle.
- **Palettes.**
  - Each palette sets a lightness and chroma, plus a hue list. Picks get ±9° of hue jitter and ±0.03 of lightness jitter.
  - Lightness and chroma: vivid 0.74/0.16, pastel 0.87/0.08, electric 0.7/0.25, muted 0.7/0.055, warm 0.76/0.15, cool 0.72/0.13, mono 0.66/0.035.
  - The anchor hues and the per-palette hue lists are the ones in the sheet.
- **Fills.**
  - Morph uses a solid fill.
  - Gradient puts two radial "mesh" spots over the base color (hues +50..110 and −30..70), then the sheen.
  - Aura uses three radial spots, then the sheen, then a white rim at 0.28 opacity on circles. Aura's shape is `circle` or `squircle`.
- **Opaline sheen** (new signature trait, on Gradient and Aura only): a white radial at (0.3, 0.2), r 0.55, opacity 0.42 to 0.
- **Backdrop** `tint`: a circle in `oklch(0.95 0.03 bodyHue)`. It does not apply to Aura.

## Locked design (0.4 gate, approved 2026-11-03)

The reference implementation is [docs/design/gate-0.4.html](../../design/gate-0.4.html). It builds on the 0.2 sheet, and everything in "Locked design (0.2 gate)" still holds. The core reproduces the new geometry and numbers below exactly. Where this section and the sketch differ, this section wins.

### Approaches considered

- **Sketch first, then core (chosen).** A throwaway sheet is approved, then the core copies its numbers. It is the process that worked for 0.2, and art changes are cheap before goldens exist.
- **Core first** was rejected: every art change during review would churn tests and goldens.
- **Two gates (finishes, then Clay)** was rejected: the phase plan has one 0.4 gate.

### Finishes

- `finish: 'flat' | 'soft' | 'gloss'` applies to Morph, Gradient and Clay. Aura ignores it.
- Defaults: Morph and Gradient `flat`, so their 0.2 output is unchanged byte for byte. Clay `soft`.
- Defaults are filled in before hashing and before `toJSON()` (builder's call). `finish: 'flat'` on Morph or Gradient, set or not, gives the 0.2 IDs and the 0.2 JSON, which has no `finish` key. A non-default finish adds `finish` to the JSON.
- With `soft` or `gloss`, Gradient drops the opaline sheen; the finish light replaces it. With `flat`, Gradient is exactly 0.2.
- No finish takes a random draw. Finishes never touch a fork.
- **`soft`** adds two gradients, painted over each finished part (same path, gradient fill):
  - shade: radial at (0.66, 0.92), r 0.78, `oklch(0.3 0.06 bodyHue)` from opacity 0.42 to 0.
  - light: radial at (0.3, 0.22), r 0.58, white from opacity 0.5 to 0.
- **`gloss`** is `soft` plus, on the main body only:
  - rim: the body path stroked at width 1.6 with a linear gradient (0,0)→(1,1), white from opacity 0.7 at 0 to 0 at 0.5.
  - highlight: a white ellipse at opacity 0.85, centered at `(x + 0.3w, y + 0.19h)` of the body's bounding box, rx 0.1w, ry 0.05h, rotated −32°.
  - glint: a white circle at opacity 0.7, at the highlight center plus `(0.13w, −0.03h)`, r 0.022w.

### Clay

- `clay` options: `body: 'jelly' | 'hood'`, `ears: 'cat' | 'bear' | 'bunny'`, plus the blob options (`family`, `expression`, `mood`, `face`, `palette`, `backdrop`, `finish`). Face is on by default.
- **Pick order.** Clay uses a new fork named `clay`. Its draws are always taken, in this order, whether or not an option fixes the value: body (`next() < 0.5` → jelly), family (pick from egg, duo, cushion, tri), arm height, wave, left arm angle, right arm angle, ears. A set option then overrides the drawn value. This differs from the sketch, which skips draws for set options. The face uses the `face` fork as in 0.2.
- Colors: body `base = oklch(l c h)` from the palette pick; parts use `dark = oklch(l − 0.07, c, h)`.
- **`jelly`.**
  - The genome (shape fork, families above) is scaled about the center: `x' = 50 + (x − 50)·0.78`, `y' = 53 + (y − 50)·0.8`, then smoothed as in 0.2.
  - Arm height `ay = y + h·(0.56..0.68)` of the scaled body's bounding box. The arm anchors are the min and max x of the scaled samples within 5 of `ay`.
  - Arms are ellipses rx 7.5, ry 5.2, filled `dark`, painted before the body. The left arm is at `(minX + 1, ay)`, rotated 18..34°.
  - The right arm mirrors it at `(maxX − 1, ay)`, rotated −(18..34)°. When `wave` (`next() < 0.33`), it sits at `(maxX + 1, ay − 13)`, rotated −62°.
  - With `soft` or `gloss`, each arm also gets the shade gradient. It gets no light, rim or highlight.
  - The face uses the inscribed center of the scaled body.
- **`hood`.**
  - Hood: an ellipse at (50, 58), rx 39, ry 36, filled `base`, with the finish.
  - Face opening: an ellipse at (50, 62), rx 25.5, ry 22.5, filled `oklch(0.95 0.025 bodyHue + 30)`, stroked `dark` at width 3.2.
  - Face: a fixed center (50, 63) and radius 21, then the 0.2 placement rule.
  - Ears are painted before the hood, in `dark`, each with an inner ear in `oklch(0.82 0.08 12)`:
    - cat: outer path `M17 40L24 9Q26 4 31 7L48 24Z`, inner `M24 32L27 15Q28 12 31 14L40 23Z`. The right ear is mirrored about x = 50.
    - bear: circles at (50 ± 27, 25), r 11; inner r 5.8.
    - bunny: ellipses at (50 ± 14, 17), rx 7.5, ry 17, rotated ±12°; inner at (50 ± 14, 19), rx 3.6, ry 12.
- `toJSON()` adds `body`, `finish`, and `family` and `wave` (jelly) or `ears` (hood).
- **Theme variables** (builder's call): `--avatar-c1` is always the body, as in the core today. Arms and ears are `--avatar-c2` (`dark`), and the hood opening is `--avatar-c3`. The tint backdrop stays `--avatar-bg`. The sketch's paint-order numbering is not followed.
- Size budget: core + clay ≤ 8 KB gzip.

### 500-avatar perf check

- A Vitest bench in `packages/core` builds 500 Clay `gloss` avatars from 500 distinct seeds as SVG strings.
- Target: under 100 ms on a mid-range laptop. The CI test fails above 250 ms, to allow for slow shared runners. (Builder's call; the user approved a 100 ms proposal.)
- The sketch measured about 430 ms in a container; the core must do better. The likely costs are the inscribed-center scan and the OKLCH gamut search, so caching is allowed if output stays byte-identical.

### Wrappers (builder's call)

0.4 brings Clay to every wrapper. The element accepts `look="clay"`, and every wrapper takes `finish`, `body` and `ears`. Clay joins the shared contract suite.

### Left to the builder

- Where finish code lives (a shared `parts/finish.ts` is suggested), and how a style declares its default finish.
- Golden fixtures for Clay, and for Morph and Gradient in `soft` and `gloss` (50 seeds each), with the same Node and browser parity as 0.2.
