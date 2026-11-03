# Inlaylab Avatar — design

Working name: `@inlaylab/avatar`. The final name comes before the first publish.

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

| Style    | Face                      | Look                                                                                                                              | Budget (gzip) |
| -------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Aura     | never                     | Circle or squircle with 2–4 OKLCH radial gradients at seeded points, plus a soft light sweep. No filters.                         | ≤1 KB         |
| Morph    | default on, `face: false` | Shape genome, solid fill, face kit                                                                                                | ≤2 KB         |
| Gradient | default on, `face: false` | Shape genome, mesh fill (layered radial gradients), face kit                                                                      | ≤2 KB         |
| Clay     | yes                       | `soft`/`gloss` finish. Bodies: `jelly` (genome plus nub arms), `hood` (animal-ear hood)                                           | ≤8 KB         |
| Persona  | yes                       | Parametric people: head, hair, brows, eyes, mouth, glasses, earrings, top. Circle backdrop with dots. Finish is `flat` or `soft`. | ≤20 KB        |

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
- **IDs.** Gradient IDs are prefixed with a hash of the seed, the style name and the resolved options. Two avatars with the same seed but different options can sit on one page without an ID clash. `Math.random` is never used.
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
packages/styles     aura, morph, gradient, clay, persona (subpath exports)
packages/element    custom element, no Lit
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
