# 0.2 Blob Family Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Aura, Morph and Gradient styles, plus Web Component, React and Angular wrappers that pass one shared contract suite, and a docs page with a 100-seed grid.

**Architecture:**

- The shared parts live in `packages/core/src/parts/`: palette, shape genome, inscribed center and face kit.
- Each style is a small file in `packages/core/src/styles/`, published as a subpath (`@inlaylab/opaline/morph`).
- Wrappers are thin. Each one renders `createAvatar(...)` inside a root `<span>` that carries the image fallback and the a11y contract.
- A private `packages/contract` package holds the contract cases. Each wrapper runs them against its own SSR or DOM output.

**Tech Stack:**

- From 0.1: TypeScript 6, tsdown, Vitest 5 with browser mode.
- React 19.3, with `react-dom/server` for SSR tests.
- Angular 22.2: ng-packagr, `@angular/platform-server`, zoneless.
- jsdom 30 for the element tests.
- Astro 7 for docs.

**Spec:** `docs/superpowers/specs/2026-11-03-avatar-design.md`. Read its "Locked design (0.2 gate)" section first. The approved reference sketch is `docs/design/gate-0.2.html`, and every geometry number below comes from it.

## Global Constraints

- **Branch and release:** branch `feat/blob-family`, one PR, release `0.2.0`. All packages are in the changeset fixed group `["@inlaylab/opaline", "@inlaylab/opaline-*"]`.
- **Commits:** Conventional Commits, no AI attribution lines. Never publish.
- **Core rules:**
  - Zero runtime dependencies.
  - No `Math.random`, `Date` or DOM in `packages/core/src`.
  - Numbers in SVG output go through `num()`.
  - Gzip size budgets (size-limit): `{ createAvatar }` ≤ 3 KB; core + morph ≤ 5 KB; core + gradient ≤ 5 KB; core + aura ≤ 4 KB; each wrapper's own code (core excluded) ≤ 1.5 KB.
- **Fixed pick order:** forks are named `color`, `shape`, `mesh`, `aura`, `face`. A new option never adds a draw to an existing fork.
- **CSS variables:** colors come out as `cssVar(n, hex)`, with `n` counting from 1 per avatar in paint order.
- **Wrapper markup contract**, the same for every framework:
  ```
  <span data-opaline="" style="display:inline-block;width:{size}px;height:{size}px;position:relative" [role="img" aria-label="{alt}" | aria-hidden="true"]>
    {core svg rendered with title omitted}
    [<img src="{src}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit" hidden>]
  </span>
  ```
  - The `img` drops `hidden` once it loads. The svg is never removed, so a failed `src` leaves the generated avatar.
  - With `alt`, the root has `role="img"` and an `aria-label`. Without `alt`, the root is `aria-hidden="true"`.
- **Same-avatar IDs:** each wrapper passes a stable per-instance `instance` string.
  - React: `useId()`.
  - Angular: a root-provided counter, the same pattern as Ivorie `IvIdGenerator` in `ivorie/projects/ui/core/id.ts`.
  - Element: a module counter.
- **`look`:**
  - The element takes a style name string (`morph`, `gradient` or `aura`).
  - React and Angular take the style object (`look={morph}`), so unused styles tree-shake away.

## Review Focus

1. **The same user twice on one page.** Two `<Avatar seed="ada" look={morph}/>` render with different ID suffixes and identical pictures. Test: Task 1 (core) and the contract case `instance ids differ` (Task 7).
2. **Seed from optional user data is `null` or `undefined`.**
   - It renders as the seed `''` and does not throw.
   - It never becomes the text "undefined", so users with no email don't all share one avatar.
   - Test: Task 1.
3. **`src` that 404s, or `src` that is already cached when SSR markup hydrates.**
   - On 404 the svg stays visible.
   - When the image is cached, it shows without waiting for a `load` event that already fired.
   - The same `img.complete` check as Ivorie `IvAvatarImage` (`ivorie/projects/ui/avatar/avatar.ts:76-79`).
   - Test: the contract cases `error keeps svg` and `cached image shows` (Task 7).
4. **Face on a thin shape.** For 300 seeds, the inscribed radius is at least 20, so the face never touches an edge. Test: Task 4.
5. **Option changes after mount** (seed or look changes on a live component). The SVG updates, and the image state resets to loading for a new `src`. Test: the contract case `updates on change` (Tasks 7–9).

---

### Task 1: Core hardening for wrappers

**Files:**

- Modify: `packages/core/src/seed.ts`, `packages/core/src/create.ts`, `packages/core/src/svg.ts`
- Test: `packages/core/test/create.test.ts`, `packages/core/test/seed.test.ts`

**Interfaces:**

- Produces:
  - `normalizeSeed(seed: string | number | null | undefined): string`
  - `BaseOptions` gains `instance?: string`.
  - `createAvatar` throws `RangeError('size must be a positive finite number')` for a bad `size`.

- [ ] **Step 1: Write failing tests**
  - `normalizeSeed(null)` and `normalizeSeed(undefined)` both equal `''`.
  - `size: Infinity`, `size: 0` and `size: NaN` each throw that `RangeError`.
  - **`instance`:**
    - With `instance: 'r1'`, the gradient ID is `` `${prefix}-g-r1` ``.
    - The SVG with `instance: 'r1'`, after removing `-r1`, equals the SVG with no instance.
    - `toJSON()` is equal with and without an instance.
  - A style whose picks contain `seed: 'X'` still yields `toJSON().seed === 'a'`.
  - `escapeXml('x\u0001y')` equals `'xy'`.
- [ ] **Step 2:** Run `pnpm --filter @inlaylab/opaline test -- --project node`. Expected: the new tests FAIL.
- [ ] **Step 3:** Implement.
  - `createIds(prefix, instance?)` appends `-${instance}`.
  - `instance` is excluded from the hash, like `size` and `title`.
  - In `toJSON`, spread picks first: `{ ...picks, style, seed }`.
  - `escapeXml` strips `[\u0000-\u0008\u000B\u000C\u000E-\u001F]`.
- [ ] **Step 4:** Run the tests. Expected: PASS. The 50 fixture goldens are unchanged.
- [ ] **Step 5:** Commit: `feat(core): instance ids, null seeds and size validation`.

### Task 2: Palettes

**Files:**

- Create: `packages/core/src/parts/palette.ts`
- Test: `packages/core/test/palette.test.ts`

**Interfaces:**

- Produces:
  - `type PaletteName = 'vivid' | 'pastel' | 'electric' | 'muted' | 'warm' | 'cool' | 'mono'`
  - `PALETTES: Record<PaletteName, { l: number; c: number; hues: readonly number[] }>`, with values copied from the sheet.
  - `pickBase(rng: Rng, palette: PaletteName): { h: number; l: number; c: number }`. It uses `rng.fork('color')`: hue is `pick(hues) + float(-9, 9)`, and lightness is `l + float(-0.03, 0.03)`.

- [ ] **Step 1: Write failing tests**
  - For each palette and 200 seeds, `pickBase(...).h` is within 9 of one of that palette's hues.
  - `l` is within 0.03 of the palette's `l`.
  - `pickBase(createRng('a'), 'vivid')` gives the same result on every call.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement from the sheet. Anchor hues: `[18, 42, 70, 145, 172, 205, 238, 268, 300, 335]`.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(core): oklch palettes`.

### Task 3: Shape genome

**Files:**

- Create: `packages/core/src/parts/shape.ts`
- Test: `packages/core/test/shape.test.ts`

**Interfaces:**

- Produces:
  - `type Family = 'egg' | 'duo' | 'tri' | 'cushion' | 'clover' | 'petal'`
  - `FAMILIES: readonly Family[]`
  - `genome(rng: Rng, family?: Family): { family: Family; lobes: number; poly: [number, number][]; d: string }`. It uses `rng.fork('shape')`.
  - `smoothPath(points: [number, number][]): string`: closed Catmull-Rom to cubic Béziers.

- [ ] **Step 1: Write failing tests**
  - `poly.length` is 72.
  - Every point of 300 seeds lies within `[8, 92]`, and the larger bbox side is 84 ± 0.01.
  - Each family is forced once, with `lobes` of 1, 2, 3, 4, 4 and 5–6.
  - `d` starts with `M`, ends with `Z`, and has `poly.length / 3` `C` commands.
  - The same seed gives the same `d`.
  - Over 600 seeds without a forced family, every family appears.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement exactly the formula and draw order of `genome()` in `docs/design/gate-0.2.html`. Draw order: family, (lobes), amp, phase jitter, 3 × (wobble amp, wobble phase), sx.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(core): seeded shape genome`.

### Task 4: Inscribed center

**Files:**

- Create: `packages/core/src/parts/inscribed.ts`
- Test: `packages/core/test/inscribed.test.ts`

**Interfaces:**

- Produces: `inscribed(poly: [number, number][]): [x: number, y: number, r: number]`. It runs a 16×16 grid over 10..90, then a 10×10 refine over ±5.

- [ ] **Step 1: Write failing tests**
  - For a 72-point circle of radius 40 at (50, 50), the result is within 1 of `[50, 50, 40]`.
  - For 300 genome seeds, `r ≥ 20`, and the point is inside the polygon.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement: even-odd point-in-polygon, plus the minimum distance to the segments.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(core): inscribed face center`.

### Task 5: Face kit and expressions

**Files:**

- Create: `packages/core/src/parts/face.ts`
- Test: `packages/core/test/face.test.ts`

**Interfaces:**

- Produces:
  - `type Mood = 'happy' | 'calm' | 'surprised' | 'playful'`
  - `type Expression = 'beam' | 'content' | 'proud' | 'dreamy' | 'hmm' | 'shy' | 'sleepy' | 'curious' | 'oh' | 'cheeky' | 'wink' | 'giggle'`
  - `EXPRESSIONS: Record<Expression, { mood: Mood; eyes: [Eye, Eye]; mouth: Mouth; blush?: number; brow?: 'raise' | 'flat'; look?: [number, number] }>`
  - `face(rng: Rng, at: { x: number; y: number; r: number; hue: number }, opts: { mood?: Mood; expression?: Expression }): { svg: string; expression: Expression }`. It uses `rng.fork('face')`, draws in the order expression, spread, tilt, and places the face at `y − 0.08·r`.

- [ ] **Step 1: Write failing tests**
  - The keys and moods match the spec's table exactly. There are 12 expressions.
  - `mood: 'calm'` over 200 seeds only yields dreamy, hmm, shy or sleepy.
  - `expression: 'wink'` always gives `expression === 'wink'`.
  - **Catch-lights:** every expression with a `dot` or `round` eye emits exactly 2 white circles per such eye.
  - **Ink color:** the output has no `#000000`. The ink is `oklchToHex({ l: 0.24, c: 0.035, h: hue })`.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement. Port the parts from the sheet with the same coordinates, and use `el()`/`num()` for all output.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(core): face kit with 12 curated expressions`.

### Task 6: Styles: Morph, Gradient, Aura

**Files:**

- Create: `packages/core/src/styles/morph.ts`, `gradient.ts`, `aura.ts`, `packages/core/test/styles.test.ts`, and `packages/core/test/golden.test.ts` cases for each style.
- Modify:
  - `packages/core/package.json`: exports `./morph`, `./gradient`, `./aura`, each with `types` and `import`.
  - `packages/core/tsdown.config.ts`: add the entries.
  - `.size-limit.json`: add the budgets from Global Constraints.

**Interfaces:**

- Produces:
  - `morph: Style<MorphOptions>`, `gradient: Style<GradientOptions>`, `aura: Style<AuraOptions>`.
  - `type BlobOptions = { palette?: PaletteName; family?: Family; face?: boolean; mood?: Mood; expression?: Expression; backdrop?: 'none' | 'tint' }`. `MorphOptions` and `GradientOptions` both equal `BlobOptions`.
  - `type AuraOptions = { palette?: PaletteName; shape?: 'circle' | 'squircle' }`
  - Picks: `{ palette, hue, family, lobes, expression? }` for blob styles, and `{ palette, hue, shape }` for Aura.

- [ ] **Step 1: Write failing tests**
  - Every style renders 50 golden seeds through `goldenSuite`.
  - `face: false` gives no `<circle fill="#fff"` and no `expression` pick.
  - Aura output never contains an expression.
  - Gradient and Aura contain the sheen gradient, with `stop-opacity="0.42"`.
  - Morph has no `radialGradient`.
  - `backdrop: 'tint'` adds a circle with r 50 before the body. It is ignored for Aura.
  - Defaults: palette `vivid`, face `true`, backdrop `none`, shape `circle`.
  - **Pick isolation:** changing `face` does not change the `d` attribute of the body path.
- [ ] **Step 2:** Run the node project. Expected: FAIL. Then run with snapshot writing, and open 3 goldens per style in a browser. They must match the approved sheet's look at the same palette.
- [ ] **Step 3:** Implement each style as in the sheet's `renderAvatar`.
- [ ] **Step 4:** Run `CI=true pnpm check`. Expected: node and browser goldens are identical, and every size budget passes.
- [ ] **Step 5:** Commit: `feat(core): morph, gradient and aura styles`.

### Task 7: Contract suite and the Web Component

**Files:**

- Create:
  - `packages/contract/` (private, `@inlaylab/opaline-contract`): `src/index.ts` exports `runContract(adapter)`.
  - `packages/element/` (`@inlaylab/opaline-element`): `src/index.ts` with `class OpalineAvatar extends HTMLElement` and `customElements.define('opaline-avatar', …)` when it is not already defined. Plus `test/element.test.ts` (Vitest browser mode, Chromium and WebKit).

**Interfaces:**

- Produces:
  - `type Adapter = { name: string; render(props: Props): Promise<HTMLElement>; update(el: HTMLElement, props: Props): Promise<void>; ssr?(props: Props): Promise<string> }`
  - `type Props = { seed: string; size?: number; src?: string; alt?: string; look?: 'morph' | 'gradient' | 'aura' } & BlobOptions`
  - Each adapter maps `look` to its own input (a string for the element, a style object for React and Angular).
- **Element attributes:** `seed`, `look`, `size`, `src`, `alt`, `palette`, `mood`, `face` (`"false"` turns it off), `shape`. It re-renders on `attributeChangedCallback`. `observedAttributes` lists exactly these.

- [ ] **Step 1: Write the contract cases in `runContract`**
  1. **markup parity:** the root's svg `outerHTML` equals `createAvatar(style, { ...props, instance }).svg`, with title omitted.
  2. **alt:** the root has `role="img"` and an `aria-label` equal to alt. Without alt, the root has `aria-hidden="true"` and no role.
  3. **instance ids differ:** two renders with the same props give different gradient IDs and the same `toJSON`.
  4. **error keeps svg:** with `src` pointing at a 404, after the `error` event the svg is visible and the `img` is hidden.
  5. **cached image shows:** with `src` a `data:` 1×1 PNG, after the next animation frame the `img` is not hidden.
  6. **updates on change:** changing `seed` changes the svg. Changing `src` hides the img until its `load` fires.
  7. **ssr** (when the adapter has `ssr`): the server string contains the svg and `hidden` on the img. Hydrating it logs no mismatch.
- [ ] **Step 2:** Run `runContract(elementAdapter)` in `packages/element/test/element.test.ts`. Expected: FAIL (no element yet).
- [ ] **Step 3:** Implement `OpalineAvatar`. It builds the root span markup from Global Constraints and handles the `img` `load`/`error` events and the `complete` check. It imports all three styles by name.
- [ ] **Step 4:** Run the tests. Expected: PASS. Then run size-limit. Expected: element ≤ 1.5 KB without core.
- [ ] **Step 5:** Commit: `feat(element): opaline-avatar custom element and shared contract suite`.

### Task 8: React wrapper

**Files:**

- Create: `packages/react/` (`@inlaylab/opaline-react`, peer `react >=19`):
  - `src/index.ts`: `export { Avatar }`.
  - `src/avatar.tsx`: a server-safe component with no hooks except `useId`.
  - `src/image.tsx`: `'use client'`. It holds the `img` and its state.
  - `test/react.test.tsx`: browser mode, plus a node SSR test.

**Interfaces:**

- Produces: `Avatar(props: { seed: string | number | null | undefined; look: Style<any>; size?: number; src?: string; alt?: string } & BlobOptions & AuraOptions): JSX.Element`

- [ ] **Step 1:** Write `runContract(reactAdapter)`. `render` uses `createRoot`, and `ssr` uses `renderToString`, then `hydrateRoot` with `onRecoverableError` failing the test.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement.
  - Without `src`, the image component is not rendered. So an `Avatar` with no `src` is fully server-only (RSC-safe).
  - The svg is injected with `dangerouslySetInnerHTML`. That is safe because the core escapes all input.
- [ ] **Step 4:** Run the tests. Expected: PASS. React wrapper ≤ 1.5 KB.
- [ ] **Step 5:** Commit: `feat(react): Avatar component`.

### Task 9: Angular wrapper

**Files:**

- Create: `packages/angular/` (`@inlaylab/opaline-angular`, peer `@angular/core >=22 <23`):
  - built with ng-packagr,
  - `src/avatar.ts` (`OpalineAvatar`, selector `opaline-avatar`, standalone, OnPush, signal inputs),
  - `src/instance.ts` (a root counter service),
  - `test/angular.test.ts`, with Vitest and `@analogjs/vitest-angular`, or Angular's own Vitest builder if it supports a library outside an Angular CLI workspace. Record the choice as a ruling.

**Interfaces:**

- Produces: inputs `seed`, `look` (required, `Style<any>`), `size`, `src`, `alt`, `palette`, `family`, `face`, `mood`, `expression`, `backdrop`, `shape`.
  - The host is the root span. `host` bindings set `role`, `aria-label`, `aria-hidden` and `style`.
  - The svg is bound through `DomSanitizer.bypassSecurityTrustHtml` on a computed value. Core output is escaped, so this is safe; add a one-line comment saying so.

- [ ] **Step 1:** Write `runContract(angularAdapter)`. `ssr` uses `renderApplication` from `@angular/platform-server` with `provideZonelessChangeDetection()`.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement.
  - Image state uses the same pattern as Ivorie `IvAvatarImage`: an `effect` resets to loading on a new `src`, and `afterNextRender` checks `img.complete`.
  - Also add a test that it works as the child of Ivorie's `<iv-avatar-fallback>`. Render `<iv-avatar><iv-avatar-fallback><opaline-avatar …/></iv-avatar-fallback></iv-avatar>` with `@inlaylab/ivorie` as a dev dependency. Expected: the svg renders.
- [ ] **Step 4:** Run the tests. Expected: PASS. Angular wrapper ≤ 1.5 KB (FESM, core excluded).
- [ ] **Step 5:** Commit: `feat(angular): opaline-avatar component`.

### Task 10: Docs page with the 100-seed grid

**Files:**

- Create: `apps/docs/` (Astro 7, private): `src/pages/index.astro`.
  - It renders the 100 sheet seeds with `<opaline-avatar>` at 24, 48 and 128px for each style, plus install snippets for each package.
  - It reuses the sheet's tokens and fonts from `docs/design/gate-0.2.html`.

- [ ] **Step 1:** Run `pnpm --filter docs build`. Expected: `apps/docs/dist/index.html` exists and contains 900 `opaline-avatar` elements.
- [ ] **Step 2:** Run `pnpm --filter docs preview` and open the page in a browser. Expected: no console errors, and it matches the approved sheet.
- [ ] **Step 3:** Commit: `docs: 100-seed grid page`.

### Task 11: Release 0.2.0

**Files:**

- Create: `.changeset/blob-family.md`. It bumps `@inlaylab/opaline` `minor`, and adds the element, React and Angular packages at `0.2.0`, which the fixed group handles.
- Modify:
  - CI: install the Angular build step if needed.
  - `pnpm check`: add publint and attw for every public package.
  - `README.md`: add the packages table rows.

- [ ] **Step 1:** Run `CI=true pnpm check`. Expected: all checks pass and every size budget holds.
- [ ] **Step 2:** Run `pnpm changeset version`. Expected: every public package is at `0.2.0`.
- [ ] **Step 3:** Commit: `chore: release 0.2.0`. Do not push or publish.

## Exit gate

- `CI=true pnpm check` passes on a clean clone.
- 50 goldens × 3 styles are identical in Node, Chromium and WebKit (Firefox runs in CI).
- The contract suite passes for the element, React and Angular, including SSR for React and Angular.
- Every size budget holds.
