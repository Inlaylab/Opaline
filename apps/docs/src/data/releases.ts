/**
 * The readable layer of the changelog: a title, a plain summary and short notes per release.
 * Every line restates `packages/core/CHANGELOG.md`, which stays the source of truth and is shown
 * in full under each entry. Dates come from the release tags (1.3.0: the release commit).
 */
export type Notes = { New?: string[]; Improved?: string[]; Changed?: string[]; Fixed?: string[] }
export type Human = { title: string; summary: string; date?: string; notes: Notes }

export const RELEASES: Record<string, Human> = {
  '1.3.0': {
    title: 'Critters, Cosmos, Folk and Doodle',
    date: '2026-11-25',
    summary:
      'Four new styles, a status badge and a gummy finish. Every 1.2 seed and option set still renders the same bytes.',
    notes: {
      New: [
        '`critters`: 19 soft vinyl-toy animals, with `animal` and `coat` options.',
        '`cosmos`: 15 glowing space objects, with `object`, `tone` and a night-sky tile through `shape`.',
        '`folk` and `doodle`: people and face-only line drawings. Both have 18 expressions, 11 color looks (`scheme`) and a square tile by default. Folk defaults to `duotone`, in the seed palette color.',
        '`status`: an `online`, `away`, `busy` or `offline` badge on every style. With `title` or `alt` the label reads "Ada (away)".',
        "`finish: 'gummy'` on Morph, Gradient, Pip, Clay and Critters. Plush takes `material`: `gummy`, `flat` or `soft`, and still ignores `finish`.",
      ],
      Improved: [
        'Eight more expressions: `starry`, `love`, `laugh`, `cool`, `nice`, `smug`, `yawn` and `wow`.',
        'More shapes, by name only: Gradient `form`, Morph families `star`, `drop` and `bloom`, five Pip forms, a Clay `ghost` body with `fox` and `mouse` ears, four Plush accessories. Seeds never land on them unless you set them.',
        'Every wrapper takes every new style and option.',
      ],
      Changed: [
        'Bundles are larger: shared faces, the gummy finish, Gradient forms and the status badge ship with every style. Core + Morph is 6.6 KB gzipped, up from 4.9 KB. Making them optional is planned for 1.4.',
      ],
    },
  },
  '1.2.0': {
    title: 'Plush and Pip',
    date: '2026-11-12',
    summary:
      "Two new styles that keep the seed's color, so a user stays one color across looks. Existing output is unchanged.",
    notes: {
      New: [
        '`plush`: gummy critters with a face and a seeded accessory (`accessory`).',
        '`pip`: bold geometric forms with two pill eyes (`form`).',
        'Every wrapper accepts `accessory` and `form`.',
      ],
    },
  },
  '1.1.2': {
    title: 'Wider framework support',
    date: '2026-11-06',
    summary:
      'The wrappers now work with React 18 and Angular 20 to 22. The core package has no changes.',
    notes: { Improved: ['React 18 and Angular 20 to 22 supported by the wrappers.'] },
  },
  '1.1.1': {
    title: 'Readable initials, PNG export and groups',
    date: '2026-11-06',
    summary: 'Initials now clear WCAG AA contrast, and avatars can leave the browser as PNG.',
    notes: {
      New: [
        '`@inlaylab/opaline/png`: `toPng(avatar, { size, vars })` renders a PNG `Blob` in the browser with no dependencies. `forRaster` prepares the SVG for a server rasterizer such as resvg.',
        "`avatarGroup(members, { max, size, shape })`: the shared layout behind every wrapper's avatar group.",
        '`contrast(a, b)` gives the WCAG contrast ratio of two hex colors.',
      ],
      Improved: [
        "Initials letters are a deep shade of the tile's own hue, at least 4.5:1 on every palette. White letters were as low as 1.9:1. `--avatar-fg` still overrides.",
      ],
      Fixed: [
        'The `ellipse` shape is removed. `shape` takes `circle`, `squircle` or `square`; anything else falls back like an unknown value. 1.0 output is unchanged.',
      ],
    },
  },
  '1.1.0': {
    title: 'Initials and shapes',
    date: '2026-11-04',
    summary: 'Letters on a seeded tile, and a `shape` option on every style.',
    notes: {
      New: [
        "`initials` (`@inlaylab/opaline/initials`): the person's initials from the seed, or from `text`.",
        '`shape` on every style. Leaving it unset gives exactly the 1.0 output.',
      ],
    },
  },
  '1.0.0': {
    title: 'Stable output',
    date: '2026-11-04',
    summary:
      'The same seed and options give a byte-identical SVG for every 1.x release, guarded by a checksum file in CI.',
    notes: {
      Improved: [
        'An option set to its default gives exactly the unset output, gradient IDs included, in every style.',
        'Every package ships a README, the MIT license and full npm metadata.',
      ],
    },
  },
  '0.4.0': {
    title: 'Clay',
    summary: 'Little characters, and two new finishes.',
    notes: {
      New: [
        '`clay` with `jelly` and `hood` bodies, in every wrapper.',
        '`soft` and `gloss` finishes for Morph, Gradient and Clay. Morph and Gradient output is unchanged from 0.2.',
      ],
    },
  },
  '0.3.0': {
    title: 'Vue and Svelte',
    summary: 'Two more frameworks, and sample apps for server rendering.',
    notes: {
      New: [
        'Vue and Svelte wrappers that pass the shared contract suite.',
        'SSR sample apps for Next, Angular SSR, Nuxt and SvelteKit.',
      ],
    },
  },
  '0.2.0': {
    title: 'The blob family',
    summary: 'The first three styles and the first wrappers, all on one contract.',
    notes: {
      New: [
        'Aura, Morph and Gradient (`@inlaylab/opaline/aura`, `/morph`, `/gradient`), a seeded shape genome, 12 expressions and OKLCH palettes.',
        'Wrappers: the `<opaline-avatar>` custom element, React `Avatar` and Angular `op-avatar`. All share image fallback, an accessible name from `alt` and unique gradient IDs.',
      ],
    },
  },
  '0.1.0': {
    title: 'Foundation',
    summary: 'The seeded core, an SVG builder, OKLCH color and golden tests.',
    notes: {},
  },
}
