# Initials and Shapes (1.1.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an `initials` style and a four-value `shape` option on every style as release 1.1.0, without changing a byte of 1.0 output.

**Architecture:**

- A shared part, `parts/tile.ts`, owns the four outlines.
- Aura and the new Initials style draw their tile with it. Morph, Gradient and Clay use it for their tint backdrop, which a set `shape` switches on.
- Wrappers only widen types and pass `text` through.
- The freeze manifest grows by new keys only.

**Tech Stack:** TypeScript 6, tsdown, vitest 5, pnpm/turbo monorepo, Astro docs, changesets.

**Spec:** `docs/superpowers/specs/2026-11-04-initials-shapes-design.md`

## Global Constraints

- Every existing key in `packages/core/test/frozen-1.json` keeps its exact value; the file diff is additions only.
- With `shape` unset (or set to a style's default), output is byte-identical to 1.0.
- Core has zero runtime dependencies; no `Intl.Segmenter`.
- Size: `core` ≤ 3 KB, new `core + initials` ≤ 4 KB; wrapper own-code budgets unchanged.
- Shape values exactly: `circle` | `squircle` | `square` | `ellipse`.
- All packages version `1.1.0`.
- Branch `release/v1.1.0`, one commit. Task steps say **"no commit"**, and the commit happens once, in Task 6.

## Review Focus

1. **Hostile `text` or seed** (`<script>`, quotes, `&`, control characters) must come out escaped. The test is in Task 2.
2. **Empty, emoji-only or whitespace seeds** must draw a plain tile, with no `<text>` element and no throw. The test is in Task 2.
3. **Unknown `shape` strings** (`'nope'`, `'__proto__'`) must fall back to the default and never throw. The tests are in Tasks 1 and 3.
4. **Same seed with different shapes on one page** must give distinct gradient IDs. This is covered by the ID hash over options, and the test is in Task 3.
5. **Explicit `backdrop: 'none'` together with a shape** must still draw the tile, because `'none'` equals unset. The test is in Task 3.

---

### Task 1: Shared tile part, Aura on four shapes

**Files:**

- Create: `packages/core/src/parts/tile.ts`
- Modify: `packages/core/src/styles/aura.ts`, `packages/core/src/index.ts`
- Test: `packages/core/test/tile.test.ts`, `packages/core/test/styles.test.ts`

**Interfaces:**

- Produces:
  - `type Shape = 'circle' | 'squircle' | 'square' | 'ellipse'`
  - `SHAPES: Record<Shape, true>`
  - `tile(shape: Shape): string` (path d)
  - `rim(shape: Shape): string` (the rim element, or `''`)
  - `Shape` is exported from the core index.

- [ ] **Step 1: Write the failing tests:**
  - `tile('circle')` and `tile('squircle')` equal the 1.0 Aura strings verbatim.
  - `tile('square') === 'M0 0H100V100H0Z'`.
  - `tile('ellipse')` starts with `M50 0A40 50`.
  - `rim('square') === ''` and `rim('squircle') === ''`.
  - `rim('circle')` contains `r="48.6"`, and `rim('ellipse')` contains `rx="38.6" ry="48.6"`.
  - In `styles.test.ts`, Aura `shape: 'square'` and `shape: 'ellipse'` each give a different first path, `toJSON().shape` equals the value, and `'nope'` gives the circle output.
- [ ] **Step 2: Run** `pnpm --filter @inlaylab/opaline exec vitest run test/tile.test.ts test/styles.test.ts`. Expect a FAIL (module not found).
- [ ] **Step 3: Implement `tile.ts`.** Aura imports `SHAPES`, `tile` and `rim`, resolves the shape with `known(SHAPES, opts.shape) ?? 'circle'`, and draws the body with `rim(shape)`. The circle rim must stay `el('circle', {cx:50, cy:50, r:48.6, fill:'none', stroke:'#fff','stroke-opacity':0.28,'stroke-width':1.6})` (same attribute order). The ellipse rim is an `ellipse` element with `rx` 38.6 and `ry` 48.6, and otherwise the same attributes. Widen `AuraOptions.shape` to `Shape`.
- [ ] **Step 4: Run** the tests above plus `test/frozen.test.ts` and `test/golden-styles.test.ts`. Expect a PASS with the frozen tests unchanged. No commit.

### Task 2: Initials style

**Files:**

- Create: `packages/core/src/styles/initials.ts`
- Modify: `packages/core/src/index.ts`, `packages/core/tsdown.config.ts`, `packages/core/package.json` (exports `./initials`)
- Test: `packages/core/test/initials.test.ts`

**Interfaces:**

- Consumes: `SHAPES`, `tile`, `rim` from Task 1, plus `pickBase`, `colorVars`, `lch` and `sheen`.
- Produces:
  - `letters(seed: string, text?: string): string`
  - `type InitialsOptions = { palette?: PaletteName; shape?: Shape; text?: string }`
  - `initials: Style<InitialsOptions>`, with name `'initials'` and defaults `{ palette: 'vivid', shape: 'circle' }`
  - `InitialsOptions` is exported from the core index.

- [ ] **Step 1: Write the failing tests:**
  - `letters('ada.lovelace@inlay.dev') === 'AL'`
  - `letters('Grace') === 'G'`
  - `letters('Zoë Nguyễn') === 'ZN'`
  - `letters('grace brewster murray hopper') === 'GH'`
  - `letters('42') === '4'`
  - `letters('😀') === ''` and `letters('') === ''`
  - `letters('x', '  acme co ') === 'acm'`, since `text` is used as given, trimmed, and capped at 3 code points
  - The SVG for `text: '<&>'` contains `&lt;&amp;&gt;` and no raw `<&>`.
  - The SVG for seed `'😀'` has no `<text`.
  - Font size is `40` for two letters and `30` for three.
  - The `pastel` palette letter fill is not `#fff`, and `vivid` is `#fff` (both inside `var(--avatar-fg, …)`).
  - `toJSON()` matches `{ style: 'initials', palette: 'vivid', shape: 'circle', text: 'AL' }`.
  - Each shape gives a distinct tile path.
- [ ] **Step 2: Run** `pnpm --filter @inlaylab/opaline exec vitest run test/initials.test.ts`. Expect a FAIL.
- [ ] **Step 3: Implement** following the spec's Initials section.
  - The word split regex is `/[\s._+-]+/`. Keep words matching `/^[\p{L}\p{N}]/u`.
  - Take code points with `Array.from`.
  - Draw order: tile path with `var(--avatar-c1)` fill, then the sheen path `url(#id('s'))`, then the rim, then the text.
  - The text element's attributes are in the spec, and its content goes through `escapeXml`.
  - Add the tsdown entry `initials: 'src/styles/initials.ts'` and the `./initials` export, mirroring `./clay`.
- [ ] **Step 4: Run** the tests. Expect a PASS. No commit.

### Task 3: Shape on Morph, Gradient and Clay

**Files:**

- Modify: `packages/core/src/styles/blob.ts`, `packages/core/src/styles/clay.ts`
- Test: `packages/core/test/styles.test.ts`, `packages/core/test/clay.test.ts`

**Interfaces:**

- Consumes: `SHAPES` and `tile` from Task 1.
- Produces:
  - `BlobOptions.shape?: Shape` (Clay inherits it).
  - A helper in `parts/tile.ts`, `backdrop(shape: Shape | undefined, fill: string): string`. It returns the 1.0 `<circle cx=50 cy=50 r=50>` for `undefined` or `'circle'`, and otherwise a `path` with `tile(shape)`.

- [ ] **Step 1: Write the failing tests** for each of morph, gradient and clay:
  - With `shape: 'square'`, the SVG contains `<path d="M0 0H100V100H0Z" fill="var(--avatar-bg,` before the body.
  - With `shape: 'circle'`, the SVG contains the 1.0 tint circle and is identical to the `backdrop: 'tint'` SVG apart from IDs.
  - With no shape, the SVG has no `--avatar-bg`.
  - `{shape:'square', backdrop:'none'}` equals `{shape:'square'}`.
  - The body path (`bodyPath` helper) and `toJSON()` minus `shape` are unchanged by every shape.
  - With `shape: 'nope'`, the SVG equals the unset SVG apart from IDs, and there is no tile.
  - Two shapes on the same seed give different ID prefixes.
- [ ] **Step 2: Run** `pnpm --filter @inlaylab/opaline exec vitest run test/styles.test.ts test/clay.test.ts`. Expect a FAIL.
- [ ] **Step 3: Implement.** Resolve `const shape = known(SHAPES, opts.shape)`, and draw the backdrop when `opts.backdrop === 'tint' || shape`. Use `backdrop(shape, fill)` in both files in place of the inline circle, and set `picks.shape` only when `shape` is set. Make no RNG draws.
- [ ] **Step 4: Run** the full core suite, `pnpm --filter @inlaylab/opaline test`. Expect a PASS with the frozen and golden tests untouched. No commit.

### Task 4: Freeze coverage, defaults, goldens, size

**Files:**

- Modify: `packages/core/test/frozen-cases.ts`, `packages/core/test/frozen-1.json` (generated), `packages/core/test/defaults.test.ts`, `packages/core/test/golden-styles.test.ts`, `.size-limit.json`
- Create: `packages/core/test/__golden__/initials/*.svg`, `initials-square/*.svg` (generated by the snapshot run)

- [ ] **Step 1: Add frozen cases** exactly as the spec's "Freeze and tests" lists them. Add initials to `defaults.test.ts` (`{ palette: 'vivid', shape: 'circle' }`) and to the numeric-seed test. Add `goldenSuite(initials, 'initials')` and `goldenSuite(initials, 'initials-square', { shape: 'square' })`.
- [ ] **Step 2: Run** `pnpm --filter @inlaylab/opaline freeze`, then `git diff -U0 packages/core/test/frozen-1.json | grep '^-[^-]'`. Expect **no output**, which proves no existing checksum changed.
- [ ] **Step 3: Run** `pnpm --filter @inlaylab/opaline exec vitest run -u test/golden-styles.test.ts`, then `pnpm --filter @inlaylab/opaline test`. Expect a PASS, with `git status` showing only the new golden directories.
- [ ] **Step 4: Update `.size-limit.json`.** Add "core + initials" (`{ createAvatar }` + `{ initials }`, limit `4 KB`). Add `@inlaylab/opaline/initials` to the element's `ignore`. Then build and run `pnpm build && pnpm size`. Expect every entry to be under its limit. No commit.

### Task 5: Wrappers, contract, playground, docs

**Files:**

- Modify: `packages/react/src/avatar.tsx`, `packages/vue/src/avatar.ts`, `packages/svelte/src/lib/*` (props type), `packages/angular/src/avatar.ts`, `packages/element/src/index.ts`, `packages/contract/src/index.ts`, `apps/docs/src/pages/index.astro`, `apps/docs/src/scripts/playground.ts`, `apps/docs/e2e.test.ts`, `README.md`, `packages/core/README.md`, `docs/superpowers/specs/2026-11-03-avatar-design.md`

**Interfaces:**

- Consumes: `InitialsOptions`, `Shape` and `initials` from Tasks 1–2.

- [ ] **Step 1: Add the contract test.** In `packages/contract/src/index.ts`, `look` gains `'initials'` and `STYLES` gains `initials`. Add a shared test: `look: 'initials', shape: 'square', text: 'OP'` renders markup equal to the core's `createAvatar(initials, {...})` with IDs stripped, as the existing contract tests compare.
- [ ] **Step 2: Wrappers.**
  - React, Vue and Svelte props: `& InitialsOptions`.
  - Angular:
    - `shape = input<Shape>()`
    - `text = input<string>()`, passed through
    - host `'[attr.text]': 'null'`
  - Element: `initials` in `LOOKS`, `'text'` in `ATTRS`, and `text: get('text')`.
- [ ] **Step 3: Playground.**
  - `LOOKS` and `STYLES` include `initials`.
  - The shape select is shown for every style, with options `default`, `circle`, `squircle`, `square` and `ellipse`. For Aura and Initials the empty option reads "circle (default)", and for the rest "none (default)".
  - Add a `pg-text` input field, shown only for initials and wired to `input` events.
  - Hide finish and expression for initials, as for aura.
  - The e2e test drives `pg-style=initials` with `pg-shape=square` and compares against the core output.
- [ ] **Step 4: Docs.**
  - The README styles table gets an Initials row.
  - A "Shapes" section shows all four with one code line.
  - The core README options line mentions `shape` (every style) and `text` (Initials).
  - The 1.0 spec: change "Initials." under Non-goals to "Initials (shipped in 1.1, see 2026-11-04-initials-shapes-design.md)", and change the Shape line to the four values.
- [ ] **Step 5: Run** `pnpm build && pnpm test && pnpm lint && pnpm check:pkg`. Expect all green. Then run `pnpm e2e`, expecting green, or record which suites can't run here. No commit.

### Task 6: Version, verify, single commit

**Files:**

- Create: `.changeset/initials-and-shapes.md` (consumed by `changeset version`)
- Modify: package versions and `CHANGELOG.md` files (generated)

- [ ] **Step 1: Write the changeset.** Mark `"@inlaylab/opaline": minor`, plus each wrapper as minor. The body reads: "New `initials` style (`@inlaylab/opaline/initials`) and a `shape` option (`circle`, `squircle`, `square`, `ellipse`) on every style. 1.0 output is unchanged."
- [ ] **Step 2: Run** `pnpm exec changeset version`. Expect all six `package.json` files at `1.1.0` and CHANGELOG entries added.
- [ ] **Step 3: Run** `pnpm install --lockfile-only`, then the full `pnpm build && pnpm test && pnpm lint && pnpm size && pnpm check:pkg` and `pnpm e2e`. Expect green.
- [ ] **Step 4: Re-check the freeze guard:** `git diff -U0 origin/main -- packages/core/test/frozen-1.json | grep '^-[^-]'`. Expect no output.
- [ ] **Step 5: Make one commit:** `feat: initials style and shapes for every style (1.1.0)`, with the session trailers. Push with `git push -u origin release/v1.1.0`.
