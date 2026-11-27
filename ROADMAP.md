# Roadmap

What comes next and what is not done yet. Shipped work is in the [CHANGELOG](CHANGELOG.md). Updated 2026-11-27.

## Status

Latest on npm: 1.2.0. Next:

1. **1.3.0:** merge `release/v1.3.0` into `main`, then run the Release workflow from the Actions tab. Publishing is always a manual step.

Open items:

- The docs site loads Bricolage Grotesque, Figtree and Geist Mono from Google Fonts. Self-host them, so visitors' IP addresses never go to Google (in 2022 a German court awarded damages against a site for doing this).

## Releases

| Release | What                                                       | Status  |
| ------- | ---------------------------------------------------------- | ------- |
| 1.3.0   | Critters, Cosmos, Folk, Doodle, status badge, gummy finish | ready   |
| 1.4.0   | Moji, smaller bundles, Angular group options               | planned |
| 2.0.0   | Seeds draw the full 1.3 pools; Gradient forms by default   | planned |

Within 1.x, a seed you already use keeps drawing the same avatar. Anything that changes an existing seed waits for 2.0, the way DiceBear, Boring Avatars and Jdenticon freeze output within a major version.

## 1.3.0: four styles, status and gummy

Branch `release/v1.3.0`. Built, reviewed and green on `pnpm check`. Every 1.2 seed and option set renders the same bytes.

Features:

- Critters: 19 vinyl-toy animals, eight of them with their own outlines (frog, owl, chick, axolotl, lion, pig, mouse, octopus), in a natural or a palette coat.
- Cosmos: 15 space objects with colour themes and a night-sky tile. The Earth and the ringed planet were cut; ufo, rocket, asteroid, supernova and satellite were added.
- Folk and Doodle: people and face-only line drawings, with 18 expressions in five moods and 11 colour looks. Folk defaults to duotone in the seed's palette hue.
- A status badge (online, away, busy, offline), told apart by shape as well as colour: a dot, a crescent, a bar and a ring.
- The gummy finish on Morph, Gradient, Pip, Clay and Critters, and Plush `material`.
- Opt-in only: eight expressions, nine Gradient forms, three Morph families, five Pip forms, a Clay ghost body with fox and mouse ears, and four Plush hats.

Fixes from the pre-release review (2026-11-27):

- Doodle `fill` was in the docs but never built; it is gone from the docs.
- Plush ignores `finish` again, as in 1.2, so a finish shared across looks cannot change it.
- A requested tongue-out face never goes with a headscarf.
- Gummy bubbles stay inside the Critters head.
- A group-level `status` reaches members without one.
- Cosmos `tone` works as a plain attribute in Vue, Angular and the web component.
- Critters picks report `coat: 'natural'` plus a `variant`, so `coat` round-trips.

## 1.4.0

Outline only. Expand into tasks and agree on them before building.

1. **Moji:** profile-photo busts in soft studio light, on a soft gradient circle. Thirteen hair styles including a headscarf, four necklines, glasses and earrings. The 18 Folk and Doodle expressions. Moji keeps its light, so it takes only the `natural` and `bare` colour looks and the wall looks (`pastel`, `bold`, `sunrise`), plus the tile shapes. Mocked on the 1.3 design gate and moved out of 1.3 on 2026-11-25.
2. **Smaller bundles:** 1.3 ships the new faces, the gummy finish, Gradient forms and the status badge with every style, so core + morph grew from 4.91 to 6.61 KB gzipped. Split them so a style pays only for what it draws, and bring the `.size-limit.json` budgets back down.
3. **Angular group:** accept `shape: 'none'`, and pass the per-style options (`material`, `scheme`, `animal` and the rest) to its members, as the React, Vue and Svelte groups do.

Exit gate: `pnpm check` green, `test/frozen-1.json` unchanged, size budgets lower than in 1.3, and Moji approved on a design gate sheet at 24px.

## 2.0.0

Every item here changes how existing seeds look, so it needs a major version.

- Gradient draws its own forms by default (pebble, bean, cloud, leaf, shell, wave, bun, kite, cushion). Without `form`, 1.x keeps the 1.2 outline.
- Seeds draw the full pools that are opt-in in 1.3: 9 Morph families, 14 Pip forms, 3 Clay bodies and 5 ears, and 14 Plush accessories.
- The eight 1.3 expressions join the seeded mood pools.
- A new `frozen-2.json` locks the 2.x output.

## Not planned

- Doodle backgrounds (`fill`): mocked on the 1.3 gate, then dropped on 2026-11-25. Doodle keeps its colour looks.

## Backlog

Not scheduled.

- Playwright visual regression tests for every style.
- Search on the docs site.
