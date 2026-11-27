# Contributing

Thanks for helping. Read the [Code of Conduct](CODE_OF_CONDUCT.md) first.

## Set up

You need Node 22 or later (CI runs Node 24) and pnpm.

```sh
pnpm install
pnpm --filter @inlaylab/opaline exec playwright install chromium firefox webkit
pnpm dev     # build the packages, then run the docs site at http://localhost:4321/Opaline/
pnpm check   # build, test, lint, size, package checks, e2e and perf; must pass before a PR
```

The browser tests run in Chromium, Firefox and WebKit, which is why Playwright installs all three.

## Where things are

- `packages/core`: `@inlaylab/opaline`, the generator. Every style is one file in `src/styles`, and shared parts (faces, finishes, palettes, tiles) are in `src/parts`. It has no dependencies, and it must stay that way.
- `packages/react`, `vue`, `svelte`, `angular` and `element`: the wrappers. They draw nothing themselves; they pass options to the core.
- `packages/contract`: a private test suite every wrapper runs, so they all behave the same.
- `apps/docs`: the Astro docs site. `apps/ssr-*`: sample apps that check server and browser output match.

## Keep the output promise

Within 1.x, the same seed and options must draw the same SVG, byte for byte. Users store avatars, cache them on CDNs and put them in emails, so a changed byte is a bug.

- `packages/core/test/frozen-1.json` holds checksums of 1.x output. Never edit or regenerate it in 1.x. If a change makes it fail, change the code, not the file.
- A new style, or a new option value on an old style, must appear only when someone sets it. Seeds keep drawing from the old pools. Anything that would change an existing seed waits for 2.0 (see the [roadmap](ROADMAP.md)).
- Output that is new in the current release is locked in `test/frozen-1.3.json`. While that release is unpublished, regenerate it with `pnpm --filter @inlaylab/opaline freeze` and say why in the PR.
- Golden SVGs live in `packages/core/test/__golden__`. After an intended change to an unreleased style, update them with `pnpm --filter @inlaylab/opaline exec vitest run -u` and review every changed file.

## Change code

- A change to behavior comes with its tests and docs in the same PR. A bug fix comes with a test that fails without it.
- A new option reaches every wrapper: React, Vue and Svelte pick it up through `LookOptions`, while the web component needs it in `ATTRS` and Angular needs an input. Add a case to the contract suite.
- Mind the size budgets in `.size-limit.json`. If a change needs a higher budget, say why in the PR; do not raise it silently.
- New art is your own: hand-written SVG shapes, not traced or copied from another avatar set or icon library. Say where the idea came from in the PR.
- User input that reaches the SVG goes through `escapeXml`. See [SECURITY.md](SECURITY.md).

## Pull requests

- Branch from `main`: `feat/<name>`, `fix/<name>` or `chore/<name>`. One topic per PR.
- Write [Conventional Commits](https://www.conventionalcommits.org/), for example `fix(critters): keep gummy bubbles inside the head`.
- If a change affects a published package, add a changeset with `pnpm changeset` and describe the change for users. All six packages share one version.
- CI must be green.

## Report a bug or idea

Open an [issue](https://github.com/Inlaylab/Opaline/issues). Include the package, its version, and the seed and options that show the problem; a [playground](https://inlaylab.github.io/Opaline/playground/) link carries all of them. For a security problem, follow [SECURITY.md](SECURITY.md) and do not open a public issue.

By contributing, you agree to release your work under the [MIT license](LICENSE).
