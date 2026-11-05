# Opaline 1.1 — initials and shapes

Release: **1.1.0** for all six packages (they release together through the changesets `fixed` group). One commit on `release/v1.1.0`.

## Intent

Two additions, both opt-in:

1. **Initials.** An avatar with the person's initials in it. The seed picks the letters and the colour, so the same person always gets the same tile.
2. **Shape.** Every style takes a `shape` option: `circle`, `squircle`, `square` or `ellipse`. Leaving it unset gives the style's own default look.

They ship in the existing packages. Initials are a new subpath of the core (`@inlaylab/opaline/initials`), and every wrapper accepts it as a `look`. Nobody installs anything new.

## Goals

- Initials work in every wrapper and in the docs playground, just like the other styles.
- All four shapes work on every style. The playground offers all four, plus the default.
- Apps that never import `/initials` gain zero bytes.
- The new output is deterministic and frozen, the same way 1.0 output is.

## Non-goals

- Drawing the letters as paths. Letters are SVG `<text>` in the system font.
- Fonts that ship with the library, or font options.
- Shapes beyond these four. No custom paths or corner-radius numbers.
- CSS-only shaping in the wrappers (`border-radius`).

## Anti-goals

This release fails, even if it works, if any of these happens:

- Any avatar from a 1.0 seed and option set changes by one byte. The existing 2,500 checksums in `frozen-1.json` must stay untouched.
- Text from the seed or `text` reaches the SVG unescaped.
- A shape option visibly does nothing on some style.
- Gradient IDs clash between two avatars that differ only in shape.

## Constraints

- **1.x freeze.** With `shape` unset, or set to the style's default, the output must be byte-identical to 1.0. The rule "setting a default equals leaving it unset" (`defaults.test.ts`) must hold for every new option.
- **Zero dependencies** in the core. No `Intl.Segmenter`: its grapheme rules follow each engine's ICU version, so the output could differ between browsers.
- **Size budgets** (`.size-limit.json`): the core entry stays at 3 KB or less, and a new "core + initials" budget is set at 4 KB. The element's own-code budget ignores style imports, so it does not move. Ruling made during the build: "core + gradient" sat at exactly 5.00 KB in 1.0, and the shape outlines add about 0.15 KB to every blob style, so that one budget goes from 5 KB to 5.25 KB. The Angular wrapper's own code sat just under 2 KB, and the new `text` input takes it to 2.02 KB, so its budget goes from 2 KB to 2.1 KB. No other budget moves.

## Approaches (decided)

How shape works:

- **A. Shape sets the outline of the tile.** ← chosen. Styles that fill a tile (Aura, Initials) draw it in the chosen shape. Morph, Gradient and Clay draw their tint backdrop in that shape. No clip IDs are added, and the SVG stays the smallest.
- B. An SVG `clipPath` around everything. Every avatar gets an extra ID, and on transparent blob styles the clip is invisible. Rejected.
- C. CSS `border-radius` in the wrappers. The plain `svg` string (for email or files) ignores it, and it can't draw a squircle. Rejected.

How the letters are drawn:

- **SVG `<text>` in a system font stack.** ← chosen. Every script works (Latin, Cyrillic, CJK), it stays tiny, and the SVG bytes are deterministic. The glyphs differ slightly between operating systems.
- Glyphs drawn as paths. Identical pixels everywhere, but Latin-only and about +4 KB. Rejected.

## Design

### Shared shape part: `packages/core/src/parts/tile.ts`

- `export type Shape = 'circle' | 'squircle' | 'square' | 'ellipse'`, also exported from the core index.
- `SHAPES` lookup for `known()`, and `tile(shape): string`, which returns path data in the 100×100 viewBox:
  - `circle`: `M50 0A50 50 0 1 1 50 100A50 50 0 1 1 50 0Z`. This is exactly Aura's current `CIRCLE`.
  - `squircle`: `M50 0C88 0 100 12 100 50S88 100 50 100 0 88 0 50 12 0 50 0Z`. This is exactly Aura's current `SQUIRCLE`.
  - `square`: `M0 0H100V100H0Z`. Full bleed, so apps can round it with their own CSS if they want.
  - `ellipse`: a tall oval, `rx` 40 and `ry` 50, centred, like a cameo.
- Aura imports these constants instead of defining its own. The strings must not change.

### Aura

- `shape` accepts all four. The default stays `circle`.
- The rim (white stroke at 0.28 opacity) stays on `circle` exactly as now. `ellipse` gets the same rim as an `<ellipse>` with matching inset (`rx` 38.6, `ry` 48.6). `squircle` and `square` get no rim.

### Morph, Gradient and Clay

- They gain `shape?: Shape`, with **no default value**. Unset means no tile, exactly as 1.0.
- The tint backdrop is drawn when `backdrop === 'tint'` **or** `shape` is set to a known shape. Without that, `shape` would do nothing visible.
- The backdrop outline:
  - `circle`, or tint with no shape: the existing `<circle cx="50" cy="50" r="50" …>` element, unchanged byte for byte.
  - Any other shape: `<path d={tile(shape)} fill="var(--avatar-bg, …)">` with the same colour.
- `backdrop: 'none'` equals unset (it is the default). So `{ shape: 'square', backdrop: 'none' }` still draws the square tile.
- The body and face are not scaled for the ellipse. Blob bodies fit in 8..92, so on the oval they may touch its sides. That's acceptable, and it keeps the body bytes identical across shapes.
- `picks.shape` is added only when a shape is set.
- `shape` takes no RNG draws, so it never shifts other picks.

### Initials: `packages/core/src/styles/initials.ts`

```ts
export type InitialsOptions = { palette?: PaletteName; shape?: Shape; text?: string }
export const initials: Style<InitialsOptions>
// defaults: { palette: 'vivid', shape: 'circle' }
```

- **Letters** (a pure function, unit tested):
  - If `text` is a non-empty string after trimming, use its first 3 code points as given.
  - Otherwise derive them from the normalized seed:
    - For an email, use the part before `@`.
    - Split into words on whitespace and `. _ - +`.
    - Keep words that start with a letter or digit (`/^[\p{L}\p{N}]/u`).
    - Take the first code point of the first word, plus the first code point of the last word if there are two or more words.
    - Upper-case them with `toUpperCase()`, which is locale-free.
  - Examples: `ada.lovelace@inlay.dev` → `AL`; `Grace` → `G`; `Zoë Nguyễn` → `ZN`; `42` → `4`; `😀` → no letters.
  - With no letters, the tile is drawn with no `<text>`.
- **Colour:** `pickBase(rng, palette)`, the same first draw as every style. The tile fill is `var(--avatar-c1, hex)`. The Opaline sheen gradient goes over it (one radial gradient, ID `s`).
- **Letter colour:**
  - `var(--avatar-fg, …)`.
  - White when base lightness is below 0.8.
  - Otherwise a dark shade of the base hue, `lch(0.32, 0.06, h)`.
  - With these palettes, that gives dark letters on `pastel` and white on the rest.
- **Text element:**
  - `<text x="50" y="50" dy="0.35em" text-anchor="middle" font-family="system-ui,-apple-system,'Segoe UI',Roboto,sans-serif" font-weight="600" font-size=…>`.
  - The font size is 40 for 1–2 code points and 30 for 3.
  - The letters go through `escapeXml`.
- **Rim:** the same rim rules as Aura.
- **Picks:** `{ palette, hue, shape, text }`. `text` is the letters actually drawn, or `''`.
- **Entry:** a tsdown entry `initials` and a package `exports` subpath `./initials`.

### Wrappers

- **Core types:**
  - `AuraOptions.shape` and `BlobOptions.shape` become `Shape`.
  - Export `InitialsOptions` and `Shape`.
- **React, Vue, Svelte and contract `Props`:** add `& InitialsOptions` to the prop types. They already pass the remaining props through to the core.
- **Angular:**
  - Widen the `shape` input to `Shape`.
  - Add a `text` input and pass it through.
  - Bind `[attr.text]` to null, like `shape`, so it doesn't leak as a host attribute.
- **Element:**
  - Add `initials` to `LOOKS`.
  - Add `text` to `ATTRS`, and pass `text: get('text')`.
- **Contract test:** `look` gains `'initials'` and `STYLES` gains `initials`, so the shared wrapper tests cover it.

### Playground and docs

- The playground gets `initials` as a style option.
- The shape field moves from Aura-only to every style, offering `default`, `circle`, `squircle`, `square` and `ellipse`.
- A `text` field shows for initials only.
- The generated snippets include `shape` and `text` when set.
- README:
  - Add Initials to the styles table.
  - Add a short "Shapes" section.
- The core README gets the same additions.
- `docs/superpowers/specs/2026-11-03-avatar-design.md`:
  - Move Initials out of non-goals ("shipped in 1.1").
  - Update the "Shape (clip)" line to the four shapes, pointing to this document.

### Freeze and tests

- **Frozen cases:** add these in `test/frozen-cases.ts`:
  - `initials`: `{}`, `{ shape: 'squircle' }`, `{ shape: 'square' }`, `{ shape: 'ellipse' }`, `{ palette: 'pastel' }` and `{ text: 'Op' }`.
  - `aura`: `{ shape: 'square' }` and `{ shape: 'ellipse' }`.
  - `morph`, `gradient` and `clay`: `{ shape: 'circle' }`, `{ shape: 'squircle' }`, `{ shape: 'square' }` and `{ shape: 'ellipse' }`.
- **Regenerate the manifest:** run `pnpm --filter @inlaylab/opaline freeze`. The diff of `frozen-1.json` must contain **only added keys**. The builder must verify that no existing line changed before committing.
- **`defaults.test.ts`:** add `initials` with `{ palette: 'vivid', shape: 'circle' }`.
- **Unit tests:**
  - Letter extraction, using the examples above.
  - Escaping: `text: '<&>'` gives escaped output.
  - Unknown shape strings fall back to the default without throwing.
  - Each shape gives a different tile and the expected rim.
  - Blob styles with a shape draw a tile, and with no shape draw none.
  - A shape never changes the body path or picks other than `shape`.
- **Goldens:** extend the golden style tests if their pattern covers every style.
- **Size:** add a "core + initials" entry to `.size-limit.json`, and raise the element limit only if it is exceeded.

### Release

- One changeset (minor) for `@inlaylab/opaline` and all wrappers. Run `changeset version` so every `package.json` reads `1.1.0` and every `CHANGELOG.md` gets the entry.
- Everything goes in a single commit, `feat: initials style and shapes for every style (1.1.0)`, pushed to `release/v1.1.0`. The commit includes this document and its plan.
- **Verification before committing:** `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm size` and `pnpm check:pkg`. Also run `pnpm e2e` where browsers allow. Report anything that can't run.

## Left to the builder

- Where in each style's render the tile and backdrop code goes, and how it is factored with Aura.
- Exact font-size tuning, within ±4 of the values above, if a visual check shows the letters off-centre.
- Playground layout details.

## Amendment: 1.1.1 removes `ellipse`

- `ellipse` is removed as a hotfix in 1.1.1, so the shapes are `circle`, `squircle` and `square`.
- 1.1.0 was never published to npm, so no installed avatar changes and the 1.x freeze holds.
- `shape: 'ellipse'` is now an unknown value. It falls back like any other unknown string: a circle on Aura and Initials, and no tile on Morph, Gradient and Clay. It never throws.
- The five `{ shape: 'ellipse' }` frozen cases leave `frozen-1.json`. Every other checksum, including all 25 from 1.0, is unchanged.
- The sections above describe 1.1.0 as designed and are kept as written.

## Amendment: 1.1.1 darkens the letters

- Initials letters are now a deep shade of the tile's hue that clears WCAG AA on every palette. See [the 1.1.1 spec](2026-11-05-groups-png-legibility-design.md) for the rule and the freeze exception.
