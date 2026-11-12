# Plush and Pip — design

Two new styles for 1.2.0, inspired by the fuzzy-mascot and pill-eye-glyph trend (felt critters with
accessories; flat geometric characters with two vertical pill eyes). We take the feel, never a
character: every shape, accessory and eye is drawn as code here and must not copy any brand's mascot.

## Intent

Give apps two more default-avatar looks that sit next to Morph, Gradient, Aura, Clay and Initials
on one page and read as one family: the same seed gets the same hue in every style.

## Goals

- `plush`: a soft, fuzzy felt critter with a face and an optional seeded accessory.
- `pip`: a flat, bold geometric character with two vertical pill eyes and no mouth. Legible at 24px.
- Same seed + palette → same hue in all seven styles, locked by a cross-style test.
- Same rules as every style: deterministic, byte-identical 1.x output (added to the frozen set),
  defaults give the unset output, CSS-variable colors, no ID clashes, no filters, zero deps.
- Every wrapper (element, React, Vue, Svelte, Angular) and the docs site know both looks.

## Non-goals

- Photoreal fur. Raster textures. Animated eyes.
- Changing any existing style's output.

## Anti-goals

- Any SVG filter (`feTurbulence` etc.): slow in lists, differs by browser, breaks pixel tests.
- An avatar that reads as a known brand mascot.
- A frozen 1.x SVG changing.

## Approaches

- **Fur by fringed outline + gradients (chosen).** The silhouette is resampled densely and pushed
  out in tiny seeded tufts, so the edge reads furry; a velvet radial shade and short fibre strokes
  sit inside. Crisp, fast, tiny, deterministic.
- Fur by SVG filters: the most realistic, rejected by the no-filter rule above.
- Fur by an embedded raster: rejected; not themeable, not code-drawn MIT art, large.

## Design

### Color

Both styles call `pickBase(rng, palette)` first, exactly like the others, so the hue is a function
of seed + palette only. Secondary colors (shade, inner ear, accessory) derive from it in OKLCH.

### Plush (`@inlaylab/opaline/plush`)

- Body: the shape genome restricted to soft families (`egg`, `cushion`, `duo`, `tri`; `clover`
  read as a splat once furred), scaled to 0.88 so tufts and accessories fit in the frame.
- Fur: the outline is resampled to 96 even points; every other point becomes a seeded tuft peak
  (reach and sweep jittered so the edge never reads as a scalloped cookie). A paler, wider fuzz
  layer sits behind the body. Fill: base color, the shared `soft` shade and light, and short fibre
  strokes along the edge. `--avatar-c1` stays the body; `--avatar-c2` is the fuzz.
- Face: the shared face kit (moods, expressions, `face: false`).
- Accessory option: `none | beret | cap | beanie | glasses | shades | flower | sprout | bow | star`.
  Unset: seeded, `none` twice in the draw (about one in six is bare). Hats take a hue offset from
  the body; clips keep their natural color (gold star, green sprout) and drop to a darker shade when
  the body hue is within 40° of it. Glasses and shades are drawn inside the face group so they
  follow its tilt and spread; with `face: false` they are left off and the pick reads `none`.
- Options: `palette`, `family`, `face`, `mood`, `expression`, `backdrop`, `shape`, `accessory`.

### Pip (`@inlaylab/opaline/pip`)

- Form option: `circle | squircle | triangle | hexagon | diamond | heart | drop | pill | dome`,
  seeded when unset. Each is a rounded path in the 100×100 viewBox, slightly rotated by seed.
- Eyes: two vertical pills in a dark ink of the body hue (not themed, like the face kit), with a
  small glint each, seeded gaze, spacing, tilt and height, placed on the inscribed center so they
  never sit on a thin tip. Width never under 4.6 units, so they read at 24px. `face: false` drops
  them.
- The gloss highlight is placed from the inscribed circle, not the bounding box, so it stays on
  the body of triangles and drops.
- Fill: flat, or the existing `soft` / `gloss` finish.
- Options: `palette`, `form`, `face`, `finish`, `backdrop`, `shape`.

### Draw order

Every draw is taken in a fixed order whether or not an option is set, so setting one option never
shifts the others (the same rule as Clay).

## Left to the builder

Exact tuft amplitude, accessory art, and pip form geometry: tune by eye on a seed grid at 24, 48
and 128px.
