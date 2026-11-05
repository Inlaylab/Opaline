# Opaline 1.1.1: legible initials, groups, PNG and the site

Release: **1.1.1** for all six packages, as a second commit on `release/v1.1.1` after the `ellipse` hotfix.

## Intent

1. **Legible initials.** White letters on 1.1.0's bright tiles measured 1.9:1 to 3.5:1 against the tile, well below WCAG AA. The letters become dark.
2. **Avatar groups.** Overlapping avatars with a `+N` chip, in every wrapper.
3. **PNG output.** For places that take no SVG.
4. **The site.** Shareable playground links, demos of real screens, and a comparison with DiceBear and Boring Avatars.

## Decisions

### Initials ink

- The letter color is `oklch(L 0.06 h)`, where `h` is the tile's own hue. `L` starts at 0.32 and steps down (0.27, 0.22, 0.17) until the WCAG 2 contrast against the tile is at least 4.5:1. White wins only if it beats the darkest step. No built-in palette reaches that.
- 0.32 is the 1.1.0 pastel ink, so **pastel output is byte-identical to 1.1.0**.
- Checked on 2,000 seeds per palette: the lowest ratio is 4.50 (electric, muted, cool, mono). Vivid is at least 4.7, warm 5.1 and pastel 7.7.
- `--avatar-fg` still overrides the color.

### The freeze exception

The 1.x promise says output changes need a major version. Initials shipped in 1.1.0 one day before this change, and its default output fails basic contrast. The owner asked for the fix in 1.1.1, so this is a deliberate one-time exception:

- Only the `fill` of `<text>` changes, and only for non-pastel Initials. Four manifest keys are re-frozen: `initials {}`, `{"shape":"squircle"}`, `{"shape":"square"}` and `{"text":"Op"}`.
- The other 40 frozen cases keep every checksum. The re-freeze was checked key by key against the previous manifest.
- The root README states the exception under "Same seed, same avatar".

### Groups

- `avatarGroup(members, { max, size, shape })` in the core returns `shown`, `rest`, and inline CSS for the root, the first avatar, the others and the `+N` chip. Every wrapper renders the same markup from it: `[data-opaline-group]` (`role="group"`, `aria-label` from `alt`), `[data-opaline-member]` per avatar, `[data-opaline-more]` (`role="img"`, `aria-label="N more"`).
- `max` is a hard limit: at most `max` avatars, then the chip. A missing or invalid `max` shows everyone.
- Overlap is 25% of `size`. The ring and the fill behind each avatar are `--avatar-ring` (default `#fff`), so transparent styles never show their neighbor. The chip uses `--avatar-more-bg` and `--avatar-more-fg`.
- React, Vue and Svelte take `members` data. Angular takes `[members]`, and `max` and `size` also take static attributes. The element wraps `<opaline-avatar>` children instead, and its `look`, `size`, `palette`, `shape` and `finish` attributes are defaults for the children.
- One contract (`runGroupContract`) runs against every wrapper.

### PNG

- `@inlaylab/opaline/png`, a separate entry, so no other import grows.
- `forRaster(avatar, { size, vars })` works anywhere. It replaces each `var(--x, #hex)` with `vars['--x']` (only color-like values are accepted) or the fallback hex, and resizes the root. It is the input for server rasterizers.
- `toPng(avatar, { size, vars })` is browser only. It draws the SVG through an `Image` to an `OffscreenCanvas` (or a `<canvas>`) and returns a `Blob`. On the server it throws an error that points to `forRaster`.
- No dependencies. Node rasterizing stays a documented recipe (resvg), not a dependency.

### Site

- Every playground setting that differs from its default is written to the query string with `replaceState`. A link is read back on load, and unknown values are ignored. Share copies the link with `#playground`.
- The playground gains PNG download and a 512 px size.
- The demos are a profile card, a social post with a likes group, a team card with chat, and an admin members table. They use only `<opaline-avatar>` and `<opaline-avatar-group>`.
- `/compare/` lists facts checked against each project's npm package and README in November 2026. It shows none of their art, includes "Pick DiceBear" and "Pick Boring Avatars" cases, and invites corrections.
- A shared `Base.astro` layout gives both pages the same header, theme and footer.

## Budgets

- New size-limit entries: `png (toPng)` at 1 KB and `core avatarGroup` at 0.6 KB.
- The element and Angular budgets cover two components now: 2 KB and 3 KB.
