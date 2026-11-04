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

Styles are separate imports, so you ship only what you use: `@inlaylab/opaline/morph`, `/gradient`, `/aura` and `/clay`.

Options: `seed`, `size`, `palette`, `finish`, `expression` or `mood`, `face`, `family`, `backdrop`, plus `shape` (Aura) and `body` and `ears` (Clay). Any option you set fixes that part; the seed fills in the rest.

Colors come out as `var(--avatar-c1, #hex)`, so you can theme avatars with CSS variables. `--avatar-c1` is always the body.

Same seed, same avatar: from 1.0, the same seed and options give a byte-identical SVG in every 1.x release.

[Playground and docs](https://inlaylab.github.io/Opaline/) · [GitHub](https://github.com/Inlaylab/Opaline) · MIT for code and art.
