# 0.3 Vue, Svelte and SSR Samples Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@inlaylab/opaline-vue` and `@inlaylab/opaline-svelte`, both passing the shared contract suite, plus four SSR sample apps (Next, Angular SSR, Nuxt, SvelteKit) that each prove server markup hydrates with no mismatch.

**Architecture:**

- Vue and Svelte are thin wrappers in the same shape as React: a root `<span>` with the a11y contract, the core SVG injected as HTML, and a photo child that owns the load state.
- Each wrapper runs `runContract` from `packages/contract` in Vitest browser mode, including the `ssr` adapter (server render, then hydrate in the page).
- Sample apps live in `apps/ssr-*`. Each is private, depends on the workspace wrapper, and has one Playwright e2e test run against its production server. A shared helper in `tools/ssr-e2e.ts` holds the checks so all four apps assert the same thing.

**Tech Stack:**

- From 0.2: TypeScript 6, tsdown, Vitest 5 browser mode, Playwright, React 19.3, Angular 22.2.
- Vue 3.6 with `@vue/server-renderer`; built with plain tsdown: the component is `defineComponent` + `h()`, no SFC, so no compiler plugin is needed.
- Svelte 5 runes, packaged with `@sveltejs/package` (ships `.svelte` source + `.d.ts`); tests via `@sveltejs/vite-plugin-svelte` and `svelte/server`.
- Sample apps: Next 16 (app router), Angular 22.2 with `@angular/ssr`, Nuxt 4, SvelteKit 2 with `adapter-node`.

**Spec:** `docs/superpowers/specs/2026-11-03-avatar-design.md` (phase 0.3 row, "Component contract", "Packaging"). The 0.2 plan `docs/superpowers/plans/2026-11-03-blob-family.md` holds the wrapper markup contract this plan reuses verbatim.

## Global Constraints

- **Branch and release:** branch `feat/vue-svelte-ssr`, one PR, release `0.3.0`. New packages join the changeset fixed group `["@inlaylab/opaline", "@inlaylab/opaline-*"]`; the `apps/ssr-*` packages are private and listed in `.changeset/config.json` `ignore`.
- **Commits:** Conventional Commits, no AI attribution lines (repo rule). Never publish.
- **Wrapper markup contract:** identical to 0.2 (copy from the 0.2 plan "Global Constraints"). The svg is never removed; the `img` stays `hidden` until loaded; `alt` → `role="img"` + `aria-label`, otherwise `aria-hidden="true"`.
- **Same-avatar IDs:** Vue `useId()` (3.5+). Svelte `$props.id()` (5.20+). Both match on server and client.
- **`look`:** takes the style object (`:look="morph"` / `look={morph}`), like React and Angular.
- **Cached image after hydration:** on mount, if `img.complete`, set state from `naturalWidth > 0` (same rule as `packages/react/src/photo.tsx`).
- **Size budgets (gzip, own code, core excluded):** vue ≤ 1.5 KB; svelte compiled output is measured in the e2e app, not size-limit (it ships source).
- **Packages:** ESM only, `sideEffects: false`, `publint` and `attw --profile esm-only` clean. Svelte's `exports` uses the `svelte` and `types` conditions.
- **Peer ranges:** `vue >=3.5`, `svelte >=5.20`.

## Review Focus

1. **Hydration with a cached `src`.** The image loaded before hydration; it must show without a missed `load` event. Test: contract case `server markup hydrates without changes` (Tasks 1, 2) and each sample app's e2e (Task 3–6) loads the same `PIXEL` image.
2. **Hydration mismatch reported only as a console warning.** Vue and Svelte warn instead of throwing. The `ssr` adapters must turn a hydration warning into a rejection. Test: Tasks 1, 2 spy on `console.warn`/`console.error` during hydrate and throw on any message containing `ydration`.
3. **`src` changes on a live component.** The image state resets to loading for the new `src`, and a previous `error` state does not hide the new photo. Test: new contract case `src change resets the photo` (Task 1 adds it to `packages/contract`, every wrapper runs it).
4. **Two identical avatars in one SSR page.** IDs differ in server HTML too, not only after hydration. Test: each sample page renders `seed="ada@inlay.dev"` twice; the e2e helper asserts all `[id]` in the HTML response are unique.
5. **Seed `null`/`undefined` from props.** Renders as seed `''`, no "undefined" text. Test: Tasks 1 and 2 render with `seed: undefined` and compare against `expectedSvg({ seed: '' })`.

---

### Task 1: Vue wrapper

**Files:**

- Create: `packages/vue/{package.json,tsconfig.json,tsdown.config.ts,vitest.config.ts}`, `packages/vue/src/{index.ts,avatar.ts,photo.ts}`, `packages/vue/test/vue.test.ts`
- Modify: `packages/contract/src/index.ts` (add the `src change resets the photo` case), `.size-limit.json`, root `package.json` `check:pkg`

**Interfaces:**

- Consumes: `createAvatar`, `Style`, `BlobOptions`, `AuraOptions` from `@inlaylab/opaline`; `runContract`, `Adapter`, `Props`, `STYLES`, `PIXEL`, `BROKEN`, `expectedSvg` from `@inlaylab/opaline-contract`.
- Produces: `export const Avatar: DefineComponent<AvatarProps>` with `AvatarProps` = React's `AvatarProps` (same names, `size` default 64). Export `type AvatarProps`.

- [ ] **Step 1: Add the contract case** in `packages/contract/src/index.ts`:
  ```ts
  test(`${adapter.name}: src change resets the photo`, async () => {
    let root = await adapter.render({ seed: 'a', src: BROKEN })
    await new Promise((r) => setTimeout(r, 300))
    root = await adapter.update(root, { seed: 'a', src: PIXEL })
    await until(() => imgOf(root)?.hidden === false)
  })
  ```
  Run `pnpm --filter "./packages/*" test`. Expected: element, react, angular PASS (fix any wrapper that fails before going on).
- [ ] **Step 2: Write `packages/vue/test/vue.test.ts`** — a `runContract` adapter: `render` uses `createApp(...).mount(container)`; `update` replaces reactive props (`reactive` object passed to `h(Avatar, props)`) and awaits `nextTick()`; `ssr` uses `renderToString(createSSRApp(...))`, then `createSSRApp(...).mount(container)` over that HTML, throwing if a captured warning matches `/hydration/i`. Plus one test: `seed: undefined` matches `expectedSvg({ seed: '' })`.
- [ ] **Step 3:** Run `pnpm --filter @inlaylab/opaline-vue test`. Expected: FAIL (no `src`).
- [ ] **Step 4: Implement** `Avatar` with `defineComponent` + `h()`; svg via `innerHTML` on an inner `<span style="display:contents">`; `Photo` keyed by `src` so it remounts on change; `useId()` for `instance`.
- [ ] **Step 5:** Run tests. Expected: PASS in chromium and webkit.
- [ ] **Step 6:** Add `vue (own code)` to `.size-limit.json` (limit `1.5 KB`, ignore `vue`, `@inlaylab/opaline`) and `publint packages/vue && attw --pack packages/vue --profile esm-only` to `check:pkg`. Run `pnpm build && pnpm size && pnpm check:pkg`. Expected: all pass.
- [ ] **Step 7:** Commit: `feat(vue): Avatar component` (contract change as its own commit first: `test(contract): src change resets the photo`).

### Task 2: Svelte wrapper

**Files:**

- Create: `packages/svelte/{package.json,tsconfig.json,svelte.config.js,vite.config.ts}`, `packages/svelte/src/lib/{index.ts,Avatar.svelte,Photo.svelte}`, `packages/svelte/test/svelte.test.ts`, `packages/svelte/test/Harness.svelte`
- Modify: root `package.json` `check:pkg`

**Interfaces:**

- Produces: default component `Avatar` from `@inlaylab/opaline-svelte`, props identical to `AvatarProps` above; `export type AvatarProps`.

- [ ] **Step 1: Write the test.** `Harness.svelte` wraps `Avatar` with a `$state` props object so `update` can assign it. Adapter: `render` → `mount(Harness, { target, props })`; `update` → set props, `flushSync()`; `ssr` → `render(Harness, { props })` from `svelte/server`, put `body` in a container, then `hydrate(Harness, { target, props })`, throwing on a captured `/hydration/i` warning. Plus the `seed: undefined` test.
- [ ] **Step 2:** Run `pnpm --filter @inlaylab/opaline-svelte test`. Expected: FAIL.
- [ ] **Step 3: Implement** `Avatar.svelte` with runes: `let { look, size = 64, src, alt, ...options } = $props()`, `const instance = $props.id()`, `const svg = $derived(createAvatar(look, { ...options, size, instance }).svg)`, `{@html svg}` inside the `display:contents` span, `{#key src}<Photo {src} />{/key}`. `Photo.svelte` holds `'loading' | 'loaded' | 'error'` state and the `img.complete` check in `onMount`.
- [ ] **Step 4:** Run tests. Expected: PASS.
- [ ] **Step 5:** `build` script is `svelte-package -i src/lib -o dist`. Add `publint packages/svelte` to `check:pkg` (no attw: it cannot resolve `.svelte` entry points). Run `pnpm build && pnpm check:pkg`. Expected: pass.
- [ ] **Step 6:** Commit: `feat(svelte): Avatar component`.

### Task 3: SSR e2e helper and Next sample

**Files:**

- Create: `tools/ssr-e2e.ts`, `apps/ssr-next/{package.json,next.config.ts,tsconfig.json,app/layout.tsx,app/page.tsx,e2e.test.ts,vitest.config.ts}`
- Modify: `turbo.json` (add `e2e` task, `dependsOn: ["build"]`), root `package.json` (`"e2e": "turbo run e2e"`, appended to `check`), `.changeset/config.json` `ignore`

**Interfaces:**

- Produces: `checkSsrApp(opts: { start: string[]; port: number; cwd: string }): Promise<void>` in `tools/ssr-e2e.ts`. It spawns the server, waits for `http://localhost:${port}/`, then asserts:
  - The raw HTML response contains two `[data-opaline]` roots, each with an `<svg`, one with `role="img" aria-label="Ada"`.
  - All `id="…"` values in the raw HTML are unique (Review Focus 4).
  - In Playwright chromium: no console message matching `/hydrat/i` and no `pageerror`; after load, the `img` inside the `Ada` avatar has `hidden === false`; the svg count is still 2.
  - Kills the server in `finally`.
- Every sample page renders exactly: `<Avatar seed="ada@inlay.dev" look={gradient} src={PIXEL} alt="Ada" />` and `<Avatar seed="ada@inlay.dev" look={gradient} />` (PIXEL copied as a literal from `packages/contract`).

- [ ] **Step 1:** Write `apps/ssr-next/e2e.test.ts`: one test calling `checkSsrApp({ start: ['pnpm', 'start', '-p', '4301'], port: 4301, cwd })`, timeout 60 s.
- [ ] **Step 2:** Run `pnpm --filter ssr-next e2e`. Expected: FAIL (no app).
- [ ] **Step 3:** Implement the Next app (server component page, no `'use client'` in the page).
- [ ] **Step 4:** Run `pnpm --filter ssr-next build && pnpm --filter ssr-next e2e`. Expected: PASS.
- [ ] **Step 5:** Commit: `test(ssr): next sample app`.

### Task 4: Angular SSR sample

**Files:** Create `apps/ssr-angular/` (`ng new`-equivalent minimal app with `@angular/ssr`, zoneless, `provideClientHydration()`), its `e2e.test.ts`.

- [ ] **Step 1:** Write the e2e test (`port: 4302`, start `node dist/ssr-angular/server/server.mjs` with `PORT=4302`).
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement the page with `<op-avatar>` from `@inlaylab/opaline-angular` and the two avatars above.
- [ ] **Step 4:** Build and run e2e. Expected: PASS, including no `NG0500`-family hydration messages.
- [ ] **Step 5:** Commit: `test(ssr): angular sample app`.

### Task 5: Nuxt sample

**Files:** Create `apps/ssr-nuxt/{package.json,nuxt.config.ts,app.vue,e2e.test.ts}`.

- [ ] **Step 1:** Write the e2e test (`port: 4303`, start `node .output/server/index.mjs` with `PORT=4303`).
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement `app.vue` with the two avatars.
- [ ] **Step 4:** Build and run e2e. Expected: PASS.
- [ ] **Step 5:** Commit: `test(ssr): nuxt sample app`.

### Task 6: SvelteKit sample

**Files:** Create `apps/ssr-sveltekit/{package.json,svelte.config.js,vite.config.ts,src/app.html,src/routes/+page.svelte,e2e.test.ts}`.

- [ ] **Step 1:** Write the e2e test (`port: 4304`, start `node build` with `PORT=4304`).
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement `+page.svelte` with the two avatars; `adapter-node`.
- [ ] **Step 4:** Build and run e2e. Expected: PASS.
- [ ] **Step 5:** Commit: `test(ssr): sveltekit sample app`.

### Task 7: Docs, README, release

**Files:** Modify `README.md` (Vue and Svelte install + usage, a line per sample app), `apps/docs/src/pages/index.astro` (no change unless it lists wrappers); create `.changeset/<name>.md` (minor: "Vue and Svelte wrappers; SSR sample apps").

- [ ] **Step 1:** Write the README sections and the changeset.
- [ ] **Step 2:** Run `pnpm changeset version`. Expected: every public package at `0.3.0`, CHANGELOGs updated, sample apps untouched.
- [ ] **Step 3:** Run `pnpm check && pnpm e2e`. Expected: all pass.
- [ ] **Step 4:** Commit: `chore: release 0.3.0`. Push to `feat/vue-svelte-ssr`.
