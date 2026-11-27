# @inlaylab/opaline

Seeded, deterministic SVG avatars with zero dependencies. The same seed always gives the same avatar.

```sh
npm i @inlaylab/opaline
```

```ts
import { createAvatar } from '@inlaylab/opaline'
import { clay } from '@inlaylab/opaline/clay'

const avatar = createAvatar(clay, { seed: 'ada@inlay.dev', finish: 'gloss' })
avatar.svg // '<svg …>'
avatar.toJSON() // { style: 'clay', seed: 'ada@inlay.dev', body: 'hood', … }
```

Styles are separate imports, so you ship only what you use: `@inlaylab/opaline/morph`, `/gradient`, `/aura`, `/clay`, `/plush`, `/pip`, `/initials`, and from 1.3 `/critters`, `/cosmos`, `/folk` and `/doodle`.

Options: `seed`, `size`, `palette`, `shape` (`circle`, `squircle` or `square`, on every style), `finish`, `expression` or `mood`, `face`, `family`, `backdrop`, `status`, plus `body` and `ears` (Clay), `text` (Initials), `accessory` and `material` (Plush), `form` (Pip and Gradient), `animal` and `coat` (Critters), `object` and `tone` (Cosmos), and `scheme` (Folk and Doodle). Any option you set fixes that part; the seed fills in the rest. `LookOptions` is the type with all of them.

Status: `status: 'online' | 'away' | 'busy' | 'offline'` draws a presence badge, except below 20px. With `title`, the label reads `Ada (away)`.

Colors come out as `var(--avatar-c1, #hex)`, so you can theme avatars with CSS variables. `--avatar-c1` is always the body.

Initials letters are a deep shade of the tile's hue that clears WCAG AA (4.5:1) on every palette. Set `--avatar-fg` to change them.

PNG: `toPng` from `@inlaylab/opaline/png` renders a PNG in the browser. On the server, `forRaster` bakes in the colors for a rasterizer such as resvg.

```ts
import { forRaster, toPng } from '@inlaylab/opaline/png'

const blob = await toPng(avatar, { size: 512 }) // browser
const png = new Resvg(forRaster(avatar, { size: 512 })).render().asPng() // server, @resvg/resvg-js
```

Groups: `avatarGroup(members, { max, size, shape })` is the layout every wrapper's group component shares: which avatars to show, the `+N` count and the inline CSS.

Same seed, same avatar: from 1.0, the same seed and options give a byte-identical SVG in every 1.x release.

[Playground and docs](https://inlaylab.github.io/Opaline/) · [GitHub](https://github.com/Inlaylab/Opaline) · [Changelog](https://github.com/Inlaylab/Opaline/blob/main/CHANGELOG.md) · MIT for code and art.
