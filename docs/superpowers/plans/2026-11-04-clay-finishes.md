# 0.4 Clay and Finishes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `soft` and `gloss` finishes, the Clay style with `jelly` and `hood` bodies, a 500-avatar perf check, and Clay support in every wrapper.

**Architecture:**

- Finishes live in `packages/core/src/parts/finish.ts`: pure functions that return gradient defs and overlay paths. They take no random draws.
- A `Style` may declare `defaults`. `createAvatar` drops options equal to a default before hashing, and styles omit default values from picks, so `finish: 'flat'` on Morph or Gradient gives the exact 0.2 output.
- Clay is `packages/core/src/styles/clay.ts`, published as `@inlaylab/opaline/clay`. It reuses the genome, inscribed center and face kit.
- Wrappers gain `finish`, `body` and `ears`. The element gains `look="clay"`.

**Tech Stack:** As in 0.3: TypeScript 6, tsdown, Vitest 5 (browser mode and bench), size-limit, Changesets.

**Spec:** `docs/superpowers/specs/2026-11-03-avatar-design.md`. Read "Locked design (0.4 gate)" first; every geometry number below comes from it. The approved sketch is `docs/design/gate-0.4.html`.

## Global Constraints

- **Branch and release:** branch `feat/clay`, one PR, release `0.4.0` in the fixed group.
- **Commits:** Conventional Commits, no AI attribution lines. Never publish.
- **Core rules from 0.2 still hold:**
  - zero runtime dependencies;
  - no `Math.random`, `Date` or DOM in `packages/core/src`;
  - numbers go through `num()`;
  - a new option never adds a draw to an existing fork.
- **0.2 output is frozen:** Morph, Gradient and Aura goldens stay byte-identical, with or without `finish: 'flat'`.
- **Theme variables:**
  - `--avatar-c1` is the body.
  - Clay arms and ears are `--avatar-c2`; the hood opening is `--avatar-c3`.
  - The tint backdrop is `--avatar-bg`.
- **Size (gzip):** core + clay ≤ 8 KB. Each wrapper's own code keeps its 0.3 budget.
- **Perf:** 500 Clay `gloss` avatars build in under 250 ms in CI (target 100 ms locally).

## Review Focus

1. **Explicit default equals unset.** `createAvatar(gradient, { seed, finish: 'flat' })` must equal the 0.2 golden byte for byte, IDs included. Test: Task 1.
2. **Setting a Clay option must not shift other picks.** With `body: 'jelly'` set on a seed that draws jelly anyway, `toJSON()` is identical except key order. The same holds for `ears` on a hood seed. Test: Task 2.
3. **Unknown option strings from HTML or CMS data** (`finish="shiny"`, `body="cat"`, `ears="dog"`) fall back to the style default and never throw. Test: Task 2 (core), Task 4 (element).
4. **Same Clay avatar twice on one page.** Clay adds new gradient IDs (`fs`, `fl`, `fr`); all of them take the instance suffix. Test: the contract case `instance ids differ` run with `look: 'clay'` (Task 4).
5. **Jelly arms and hood ears stay inside the 0..100 box, and the face never touches an edge.** Test: Task 2, over 300 seeds.

---

### Task 1: Finishes and style defaults

**Files:**

- Create: `packages/core/src/parts/finish.ts`, `packages/core/test/finish.test.ts`
- Modify:
  - `packages/core/src/create.ts`: `Style.defaults`, and drop options equal to defaults before hashing;
  - `packages/core/src/styles/blob.ts`, `gradient.ts`: the `finish` option, and the sheen only when flat;
  - `packages/core/test/golden.ts`, `golden-styles.test.ts`: soft and gloss suites;
  - `packages/core/src/index.ts`: export `type Finish`.

**Interfaces:**

- Produces:
  - `type Finish = 'flat' | 'soft' | 'gloss'`
  - `FINISHES: Record<Finish, true>` (for `known()`)
  - `finishDefs(finish: Finish, id: (n: string) => string, hue: number): string`
  - `finishOver(finish: Finish, id: (n: string) => string, d: string, box?: Box): string`. Pass `box` only for the main body; without it, gloss draws no rim, highlight or glint.
  - `shadeOnly(id, d, transform?): string`, the shade path used for Clay arms and ears.
  - `bbox(poly: [number, number][]): Box`, where `Box = { x: number; y: number; w: number; h: number }`.
  - `Style<O>` gains `defaults?: Partial<O>`.
  - `BlobOptions` gains `finish?: Finish`.
  - `goldenSuite(style, name, options?)` writes to `__golden__/<name>/`.

- [ ] **Step 1: Write failing tests** in `finish.test.ts`:
  - For each SEEDS entry, `createAvatar(gradient, { seed, finish: 'flat' }).svg === createAvatar(gradient, { seed }).svg`. The same holds for morph, and their `toJSON()` is equal with no `finish` key.
  - `createAvatar(morph, { seed: 'a', finish: 'soft' }).toJSON()` has `finish: 'soft'`, and the same `family`, `hue` and `expression` as the flat version.
  - Soft gradient output contains `radialGradient` ids ending `-fs` and `-fl`, and no `-s` sheen id. Gloss also has `-fr`, plus one `<ellipse` and one `<circle` with `fill="#fff"`.
  - `finish: 'shiny' as never` renders the same as flat.
  - Add `goldenSuite(morph, 'morph-soft', { finish: 'soft' })` and `goldenSuite(morph, 'morph-gloss', { finish: 'gloss' })`, and the same pair for gradient.
- [ ] **Step 2:** Run `pnpm --filter @inlaylab/opaline exec vitest run --project node`. Expected: the new tests FAIL; the existing goldens PASS.
- [ ] **Step 3:** Implement with the spec's numbers.
  - Shade: radial (0.66, 0.92), r 0.78, `oklch(0.3 0.06 h)`, 0.42 to 0.
  - Light: radial (0.3, 0.22), r 0.58, white, 0.5 to 0.
  - Rim: stroke 1.6, linear (0,0)→(1,1), white 0.7 to 0 at 0.5.
  - Highlight: an ellipse at `(x + 0.3w, y + 0.19h)`, rx 0.1w, ry 0.05h, rotated −32°, opacity 0.85.
  - Glint: a circle at the highlight center + `(0.13w, −0.03h)`, r 0.022w, opacity 0.7.
  - `blobStyle` declares `defaults: { finish: 'flat' }` and adds `finish` to picks only when it isn't flat.
- [ ] **Step 4:** Run the node and `browser (chromium)` projects. Expected: PASS. The new golden files are written on the first run; review two of them by eye, then run again. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(core): soft and gloss finishes`.

### Task 2: Clay style

**Files:**

- Create: `packages/core/src/styles/clay.ts`, `packages/core/test/clay.test.ts`
- Modify:
  - `packages/core/tsdown.config.ts`: entry `clay`;
  - `packages/core/package.json`: export `./clay`;
  - `packages/core/src/index.ts`: export `type ClayOptions`;
  - `golden-styles.test.ts`: suites `clay`, `clay-gloss`, `clay-hood`;
  - `.size-limit.json`: "core + clay", 8 KB.

**Interfaces:**

- Consumes: `finishDefs`, `finishOver`, `shadeOnly` and `bbox` from Task 1; `genome`, `smoothPath`, `inscribed`, `face`, `pickBase`, `colorVars` and `lch` from 0.2.
- Produces:
  - `export const clay: Style<ClayOptions>`
  - `type ClayOptions = BlobOptions & { body?: 'jelly' | 'hood'; ears?: 'cat' | 'bear' | 'bunny' }`
  - `defaults: { finish: 'soft' }`
  - picks: `palette`, `hue`, `body`, `finish`, plus `family` and `wave` (jelly) or `ears` (hood), plus `expression`.

- [ ] **Step 1: Write failing tests** in `clay.test.ts`:
  - **Pick order:** for 100 seeds, let `j = createAvatar(clay, { seed }).toJSON()`.
    - If `j.body === 'jelly'`, then `createAvatar(clay, { seed, body: 'jelly' }).toJSON()` deep-equals `j`.
    - If `j.body === 'hood'`, the same holds for `{ ears: j.ears }`.
    - Setting `body: 'hood'` on a jelly seed keeps `j.hue` and `j.expression`.
  - **Bounds:** for 300 seeds × both bodies, parse every `cx`/`cy`/`d` number pair. Arms and ears stay within −1..101. The jelly inscribed radius of the scaled body is ≥ 15.
  - **Theme variables:**
    - The jelly body path fill starts with `var(--avatar-c1,`, and both arm fills start with `var(--avatar-c2,`.
    - The hood opening fill starts with `var(--avatar-c3,`.
    - The tint backdrop uses `--avatar-bg`.
  - **Unknown options:** `body: 'cat'`, `ears: 'dog'` and `finish: 'shiny'` (as never) render the same as unset and do not throw.
  - **Gloss:** gloss jelly has exactly one `-fr` stroke path (the body only).
- [ ] **Step 2:** Run the tests. Expected: FAIL (no `clay`).
- [ ] **Step 3:** Implement from the spec's Clay section.
  - Fork `clay`, with draws always taken in this order: body, family, arm height, wave, left angle, right angle, ears.
  - Jelly scales the genome by 0.78 and 0.8 about (50, 53), and smooths every 3rd sample.
  - Hood draws the ears, then the hood ellipse (50, 58, 39, 36) with the finish, then the opening (50, 62, 25.5, 22.5) stroked `dark` at 3.2. The face is at (50, 63) with r 21.
- [ ] **Step 4:** Run the core tests, then build and run `pnpm size`. Expected: PASS, with core + clay ≤ 8 KB.
- [ ] **Step 5:** Commit: `feat(core): clay style with jelly and hood`.

### Task 3: 500-avatar perf check

**Files:** Create `packages/core/test/perf.test.ts`.

- [ ] **Step 1:** Write `500 clay gloss avatars build in under 250 ms`.
  - Warm up with 20 renders.
  - Time `createAvatar(clay, { seed: 'perf-' + i, finish: 'gloss', size: 32 })` for i in 0..499.
  - Log the time per avatar, then `expect(ms).toBeLessThan(250)`.
  - Run it in the node project only.
- [ ] **Step 2:** Run it. Read the logged number. If it is over 100 ms locally, profile (`node --cpu-prof`) and optimize the top cost, likely `inscribed()` or the gamut search in `oklchToHex`. Goldens must stay byte-identical.
- [ ] **Step 3:** Run the full core suite. Expected: PASS, with goldens unchanged.
- [ ] **Step 4:** Commit: `test(core): 500-avatar perf check` (plus `perf(core): …` for any optimization, as its own commit).

### Task 4: Wrappers

**Files:**

- Modify:
  - `packages/contract/src/index.ts`: `STYLES.clay`, `Props.look` with `'clay'`, `Props` with `ClayOptions`;
  - `packages/element/src/index.ts`: `LOOKS.clay`, ATTRS `finish`, `body`, `ears`;
  - `packages/angular/src/avatar.ts`: inputs `finish`, `body` and `ears`;
  - the React, Vue and Svelte `AvatarProps`: add `& ClayOptions`;
  - `.size-limit.json`: ignore `@inlaylab/opaline/clay` for the element.

- [ ] **Step 1: Contract cases** (every wrapper runs them):
  - `clay options reach the core`: `{ seed: 'b', look: 'clay', body: 'hood', ears: 'bunny', finish: 'gloss', expression: 'wink' }` matches `expectedSvg`.
  - The `instance ids differ` case runs for both `gradient` and `clay`.
  - Element-only test: `finish="shiny" body="cat"` renders the Clay default without throwing.
- [ ] **Step 2:** Run each wrapper's tests on Chromium (the Angular tests on Chromium only). Expected: the new cases FAIL.
- [ ] **Step 3:** Implement. The Angular inputs are typed `Finish` and `ClayOptions['body' | 'ears']`, and are passed to `createAvatar` like the existing inputs.
- [ ] **Step 4:** Run all wrapper tests, `pnpm size` and `pnpm check:pkg`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: clay and finishes in every wrapper`.

### Task 5: Docs and release

**Files:** Modify `README.md` (the status line, a Clay row, `finish`), `apps/docs/src/pages/index.astro` (Clay in the style switcher if it has one); create `.changeset/clay-finishes.md` (minor, all public packages).

- [ ] **Step 1:** Write the docs and the changeset. Run `pnpm changeset version`. Expected: every public package at `0.4.0`.
- [ ] **Step 2:** Run the full local check: `pnpm -r build`, every package's tests (Chromium), `pnpm -r lint`, `pnpm size`, `pnpm check:pkg`, and the four `apps/ssr-*` e2e runs. Expected: all pass.
- [ ] **Step 3:** Commit `chore: release 0.4.0` and push `feat/clay`.
