# 0.1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A monorepo with a zero-dependency core that turns a seed into a deterministic, escaped and themeable SVG, guarded by golden snapshots, size budgets and CI.

**Architecture:**

- The core is a set of pure functions: seed normalization, hashing and PRNG, number formatting and escaping, an SVG string builder, scoped IDs, and OKLCH color.
- `createAvatar(style, options)` wires these together for any `Style`.
- A fixture style proves the pipeline and the golden harness. Real styles arrive in 0.2.

**Tech Stack:**

- Node 24, pnpm 10 (via corepack) and Turborepo.
- TypeScript 6, tsdown for builds.
- Vitest 5: Node, plus browser mode with Playwright Chromium.
- Prettier, size-limit, publint, `@arethetypeswrong/cli`, Changesets.

**Spec:** `docs/superpowers/specs/2026-11-03-avatar-design.md`

## Global Constraints

- The repo root is `D:\inlaylab\avatar`. The working package name is `@inlaylab/avatar-core`. The name will be renamed before the first publish, so keep the scope string in `package.json` files only.
- The core has **zero runtime dependencies**. `dependencies` in `packages/core/package.json` stays absent.
- Packages are ESM only, with `"type": "module"`, `types` and `"sideEffects": false`.
- License: MIT, `Copyright (c) 2026 Inlaylab`.
- Never use `Math.random`, `Date` or any DOM API in `packages/core/src`.
- Size budget: core is **3 KB or less gzip**. That covers the whole core through 0.2.
- Commits use Conventional Commits, with **no AI attribution lines**. One phase = one branch `feat/foundation` = one PR = release `0.1.0`.
- Never publish to npm in this phase.

## Review Focus

1. **Seed is a number or has odd whitespace or Unicode.**
   - `42` and `'42'` give the same avatar.
   - `' Ada@Inlay.dev '` and `'ada@inlay.dev'` give the same avatar.
   - NFD `'é'` and NFC `'é'` give the same avatar.
   - A name keeps its case: `'Ada'` is not `'ada'`.
   - Tests: Task 2.
2. **Hostile seed or title.** `'"><script>alert(1)</script>'` never appears unescaped in the SVG. Test: Task 5.
3. **Same seed, different options, same page.** The two gradient ID prefixes must differ, so one avatar's defs never paint the other. The ID prefix hashes the seed plus the resolved options, not the seed alone. Test: Task 5.
4. **Float formatting.** Numbers never print as `-0`, in exponent form (`1e-7`) or with more than 2 decimals. Otherwise output drifts across engines and grows. Test: Task 3.
5. **Empty seed `''`.** It renders the same SVG every time and does not throw. Test: Task 5.

---

### Task 1: Repo scaffold and core package skeleton

**Files:**

- Create in the root:
  - `package.json`: private, `"packageManager": "pnpm@10.<latest>"`, scripts `build`, `test`, `lint` that each run `turbo run <x>`.
  - `pnpm-workspace.yaml` (`packages/*`, `apps/*`).
  - `turbo.json`.
  - `tsconfig.base.json` (strict, `"module": "NodeNext"`, `"target": "ES2022"`, `"verbatimModuleSyntax": true`).
  - `.prettierrc` (printWidth 100, singleQuote, no semi, to match Ivorie's code style).
  - `.gitignore`, `LICENSE`, `README.md` (one paragraph plus a pointer to the spec).
  - `.changeset/config.json` (fixed group `[["@inlaylab/avatar-*"]]`, access public, baseBranch main).
- Create in `packages/core/`:
  - `package.json` (exports `.` with `types` and `import`).
  - `tsconfig.json`, `tsdown.config.ts`, `vitest.config.ts`.
  - `src/index.ts`, `test/index.test.ts`.

**Interfaces:**

- Produces: workspace commands `pnpm turbo run build test lint`. The core package builds to `packages/core/dist/index.js` and `index.d.ts`.

- [ ] **Step 1:** In `D:\inlaylab\avatar`, run `git init -b main`, then `corepack enable pnpm`.
  - If corepack needs admin rights on Windows, use `npm i -g pnpm` instead.
  - Expected: `pnpm -v` prints 10.x.
- [ ] **Step 2:** Write the root files and the core skeleton. `src/index.ts` exports `export const VERSION = '0.0.0'`. The test asserts `VERSION` is a string.
- [ ] **Step 3:** Run `pnpm i`, then `pnpm turbo run build test lint`. Expected: all pass. `lint` = `tsc --noEmit && prettier --check .`.
- [ ] **Step 4:** Commit to main: `chore: scaffold monorepo`. Then run `git switch -c feat/foundation`.

### Task 2: Seed normalization, hash and PRNG

**Files:**

- Create: `packages/core/src/seed.ts`, `packages/core/src/prng.ts`
- Test: `packages/core/test/seed.test.ts`, `packages/core/test/prng.test.ts`

**Interfaces:**

- Produces:
  - `normalizeSeed(seed: string | number): string`
  - `hash(input: string): string`: 7 chars, base36, zero-padded.
  - `type Rng = { next(): number; float(min: number, max: number): number; int(min: number, max: number): number; pick<T>(items: readonly T[]): T; fork(label: string): Rng }`
  - `createRng(seed: string): Rng`

- [ ] **Step 1: Write failing tests**
  ```ts
  test('normalizes', () => {
    expect(normalizeSeed(42)).toBe('42')
    expect(normalizeSeed(' Ada@Inlay.dev ')).toBe('ada@inlay.dev')
    expect(normalizeSeed('Ada')).toBe('Ada')
    expect(normalizeSeed('e\u0301')).toBe('\u00e9')
    expect(normalizeSeed('')).toBe('')
  })
  test('hash is stable', () => expect(hash('ada@inlay.dev')).toBe('1z0ni6c'))
  test('rng is pinned', () => {
    const r = createRng('ada@inlay.dev')
    expect([r.next(), r.next(), r.next()]).toEqual([
      0.9187400047667325, 0.7046724304091185, 0.17152338358573616,
    ])
  })
  test('fork isolates layers', () => {
    const a = createRng('s')
    a.next()
    a.next()
    expect(a.fork('face').next()).toBe(createRng('s').fork('face').next())
  })
  test('int is inclusive and in range', () => {
    /* 1000 draws of int(1,7) all within [1,7], both ends seen */
  })
  ```
- [ ] **Step 2:** Run `pnpm --filter @inlaylab/avatar-core test`. Expected: FAIL, with the modules not found.
- [ ] **Step 3:** Implement.
  - **Email rule:** a seed counts as an email when it matches `/^[^\s@]+@[^\s@]+$/` after trimming. Only emails are lower-cased.
  - **`hash`:** the first xmur3 output, `toString(36).padStart(7, '0')`.
  - **`fork(label)`:** returns `createRng(seed + '\u0000' + label)`. It never depends on how many draws were made, which is what makes pick order fixed.
  - **`createRng`:** use the exact algorithms below, then throw away the first **12** outputs:
  ```ts
  function xmur3(str: string) {
    let h = 1779033703 ^ str.length
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
      h = (h << 13) | (h >>> 19)
    }
    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507)
      h = Math.imul(h ^ (h >>> 13), 3266489909)
      return (h ^= h >>> 16) >>> 0
    }
  }
  function sfc32(a: number, b: number, c: number, d: number) {
    return () => {
      a |= 0
      b |= 0
      c |= 0
      d |= 0
      const t = (((a + b) | 0) + d) | 0
      d = (d + 1) | 0
      a = b ^ (b >>> 9)
      b = (c + (c << 3)) | 0
      c = (c << 21) | (c >>> 11)
      c = (c + t) | 0
      return (t >>> 0) / 4294967296
    }
  }
  // createRng: const h = xmur3(seed); const n = sfc32(h(), h(), h(), h()); discard 12
  ```
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(core): seed normalization, hash and seeded rng`.

### Task 3: Number format, escaping, SVG builder and scoped IDs

**Files:**

- Create: `packages/core/src/svg.ts`, `packages/core/src/ids.ts`
- Test: `packages/core/test/svg.test.ts`

**Interfaces:**

- Produces:
  - `num(n: number): string`: at most 2 decimals, no trailing zeros, never `-0`, never exponent form.
  - `escapeXml(s: string): string`: escapes `& < > " '`.
  - `el(tag: string, attrs?: Record<string, string | number | undefined>, children?: string): string`:
    - Attribute values pass through `escapeXml`. Numbers pass through `num`.
    - `undefined` attributes are left out. Attribute order is insertion order.
    - With no children, the tag self-closes (`<circle .../>`).
  - `createIds(prefix: string): (name: string) => string`, which returns `` `a${prefix}-${name}` ``.

- [ ] **Step 1: Write failing tests**
  ```ts
  expect(num(-0)).toBe('0')
  expect(num(1e-7)).toBe('0')
  expect(num(-0.004)).toBe('0')
  expect(num(12.3456)).toBe('12.35')
  expect(num(10)).toBe('10')
  expect(num(0.5)).toBe('0.5')
  expect(num(1e21)).not.toMatch(/e/i)
  expect(escapeXml(`<a href="x">'&'</a>`)).toBe(
    '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
  )
  expect(el('circle', { cx: 50, r: 10.004, fill: undefined })).toBe('<circle cx="50" r="10"/>')
  expect(el('g', {}, '<x/>')).toBe('<g><x/></g>')
  expect(createIds('1z0ni6c')('fill')).toBe('a1z0ni6c-fill')
  ```
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement. The ID starts with a letter because XML IDs may not start with a digit.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(core): svg builder, escaping and scoped ids`.

### Task 4: OKLCH color and theme variables

**Files:**

- Create: `packages/core/src/color.ts`
- Test: `packages/core/test/color.test.ts`

**Interfaces:**

- Produces:
  - `type Oklch = { l: number; c: number; h: number }`
  - `hexToOklch(hex: string): Oklch`
  - `oklchToHex(c: Oklch): string`: lower case `#rrggbb`. Values outside the sRGB gamut are clamped by reducing chroma.
  - `adjust(hex: string, d: { l?: number; c?: number; h?: number }): string`
  - `cssVar(index: number, hex: string): string`, which returns `var(--avatar-c${index}, ${hex})`.
  - `resolveVars(svg: string): string`: replaces each `var(--…, #hex)` with its hex fallback. The CLI and API need this.

- [ ] **Step 1: Write failing tests**
  - Each of `#7c5cff`, `#ffffff`, `#000000` and `#0ea5a4` round-trips through OKLCH to the same hex.
  - `hexToOklch('#ffffff').l` is close to 1, to within `1e-3`.
  - `adjust('#7c5cff', { l: -0.1 })` has a lower `l` than `#7c5cff` and the same hue, to within 1°.
  - `oklchToHex({ l: 0.7, c: 0.4, h: 150 })` matches `/^#[0-9a-f]{6}$/`. This is the gamut case.
  - `cssVar(1, '#7c5cff')` equals `'var(--avatar-c1, #7c5cff)'`.
  - `resolveVars('<path fill="var(--avatar-c1, #7c5cff)"/>')` equals `'<path fill="#7c5cff"/>'`.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement with Björn Ottosson's OKLab matrices and sRGB transfer functions. Find the gamut clamp by binary search on `c`, 16 steps.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(core): oklch color and css variable output`.

### Task 5: `createAvatar`, the Style contract and accessibility

**Files:**

- Create: `packages/core/src/create.ts`, `packages/core/test/fixture-style.ts`
- Modify: `packages/core/src/index.ts`, to export the public API from Tasks 2–5 and remove `VERSION`.
- Test: `packages/core/test/create.test.ts`

**Interfaces:**

- Consumes: `normalizeSeed`, `hash`, `createRng`, `el`, `escapeXml`, `createIds`, `cssVar`.
- Produces:
  ```ts
  type BaseOptions = { seed: string | number; size?: number; title?: string }
  type RenderContext = { rng: Rng; id: (name: string) => string; seed: string }
  type Rendered = { defs?: string; body: string; picks: Record<string, unknown> }
  type Style<O extends object = {}> = {
    name: string
    render(ctx: RenderContext, options: O): Rendered
  }
  type Avatar = {
    svg: string
    toJSON(): { style: string; seed: string } & Record<string, unknown>
    toString(): string
  }
  function createAvatar<O extends object>(style: Style<O>, options: BaseOptions & O): Avatar
  ```
- **Output shape:** `viewBox="0 0 100 100"`. `width` and `height` equal `size`, which defaults to **64**.
  - With `title`: `role="img"`, `aria-label`, and a `<title>` holding the escaped title.
  - Without `title`: `aria-hidden="true"`.
  - `defs` are wrapped in `<defs>` only when present.
- **ID prefix:** `hash(seed + '\u0000' + style.name + '\u0000' + stableStringify(options without seed, size and title))`. `stableStringify` sorts keys, and it stays private.
- **Fixture style** (`test/fixture-style.ts`): name `'fixture'`.
  - It picks a hue with `rng.fork('fill').int(0, 359)`.
  - It renders a `radialGradient` with ID `id('g')` and a circle filled by `url(#…)` with `cssVar(1, hex)` stops.
  - It returns picks `{ hue }`.

- [ ] **Step 1: Write failing tests**
  - **Same output:**
    - `createAvatar(fixture, { seed: 'a' }).svg` is identical across two calls.
    - `{ seed: 42 }` gives the same SVG as `{ seed: '42' }`.
    - `{ seed: '' }` returns a string that starts with `<svg`.
  - **Hostile seed and title:** with seed and title both `'"><script>alert(1)</script>'`:
    - the SVG does not contain `<script`,
    - it contains `role="img"`, and `&lt;script&gt;` inside `<title>`.
  - **No title:** the SVG contains `aria-hidden="true"` and does not contain `role=`.
  - **ID prefix:** the gradient ID from `{ seed: 'a', variant: 1 }` differs from the one from `{ seed: 'a', variant: 2 }`. Extract it with `/id="(a[0-9a-z]+-g)"/`.
  - **Size:** `size: 96` sets `width="96"` and `height="96"`. `viewBox` stays `0 0 100 100`.
  - **`toJSON()`:** returns `{ style: 'fixture', seed: 'a', hue: <number> }`.
  - **No randomness:** `Math.random` spied on is never called.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement `createAvatar` in `src/create.ts`. The root RNG is `createRng(normalizedSeed)`, and styles must use `fork`.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(core): createAvatar with style contract and a11y`.

### Task 6: Golden snapshot harness (Node and browser)

**Files:**

- Create: `packages/core/test/seeds.ts`, `packages/core/test/golden.test.ts`, `packages/core/test/__golden__/fixture/*.svg` (generated).
- Modify: `packages/core/vitest.config.ts`. Define two projects: `node`, and `browser` (`@vitest/browser-playwright`, Chromium, headless). Both run `golden.test.ts`. Only `node` runs the rest.

**Interfaces:**

- Produces:
  - `SEEDS: readonly string[]`: exactly 50 seeds. They include emails, mixed-case names, numbers as strings, `''`, emoji, CJK, an NFD string and a 200-char string.
  - `goldenSuite(style: Style, name: string)`: the helper 0.2 will reuse for each style.

- [ ] **Step 1:** Write `golden.test.ts`. It runs `goldenSuite(fixture, 'fixture')`, and for each seed calls `await expect(createAvatar(style, { seed }).svg).toMatchFileSnapshot(\`./**golden**/${name}/${index}.svg\`)`. File names are numbered by seed index, so seed text never becomes a path.
- [ ] **Step 2:** Run `pnpm --filter @inlaylab/avatar-core test -- --project node -u`. Expected: 50 files are written. Open 2 files and check they are valid SVG.
- [ ] **Step 3:** Run `npx playwright install chromium`, then `pnpm --filter @inlaylab/avatar-core test -- --project browser`. Expected: PASS against the same files, with no update flag. That proves Node and browser output are byte-identical.
- [ ] **Step 4:** Make the `test` script run both projects. Never pass `-u` in CI.
- [ ] **Step 5:** Commit: `test(core): golden snapshot harness for node and browser`.

### Task 7: Package checks, CI and the 0.1.0 release commit

**Files:**

- Create: `.size-limit.json`, `.github/workflows/ci.yml`, `.changeset/foundation.md`.
- Modify:
  - root `package.json`: scripts `size`, `check:pkg` (`publint packages/core && attw --pack packages/core --profile esm-only`), and `check` (build, test, lint, size, check:pkg in order).
  - `packages/core/package.json`: description, keywords, repository, `files: ["dist"]`.

**Interfaces:**

- Produces: `pnpm check`, the single local gate. CI runs the same command.

- [ ] **Step 1:** Write `.size-limit.json`:
  ```json
  [
    {
      "name": "core",
      "path": "packages/core/dist/index.js",
      "import": "{ createAvatar }",
      "limit": "3 KB",
      "gzip": true
    }
  ]
  ```
- [ ] **Step 2:** Run `pnpm check`. Expected: every step passes, and size-limit reports core under 3 KB.
- [ ] **Step 3:** Write `ci.yml`. It runs on push and on pull requests to main, on ubuntu-latest:
  1. checkout,
  2. `pnpm/action-setup`,
  3. `actions/setup-node` with Node 24 and the pnpm cache,
  4. `pnpm i --frozen-lockfile`,
  5. `pnpm exec playwright install --with-deps chromium`,
  6. `pnpm check`.
- [ ] **Step 4:** Write the changeset `minor` for `@inlaylab/avatar-core`, with the text "Foundation: seeded core, SVG builder, OKLCH color, golden tests." Run `pnpm changeset version`. Expected: version `0.1.0` and a `CHANGELOG.md`.
- [ ] **Step 5:** Commit: `chore: release 0.1.0`. Do not tag, push or publish. Creating the GitHub repo, pushing and opening the PR is the user's call.

## Exit gate

- `pnpm check` passes on a clean clone, with the output shown.
- 50 golden SVGs match in both the Node and the browser project.
- The core is under 3 KB gzip and has no `dependencies` field.
