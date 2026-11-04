# @inlaylab/opaline-react

Seeded avatars for React. `Avatar` is safe in Server Components; only the optional photo ships client code.

```sh
npm i @inlaylab/opaline-react
```

```tsx
import { Avatar } from '@inlaylab/opaline-react'
import { clay } from '@inlaylab/opaline/clay'

;<Avatar seed={user.email} look={clay} src={user.photo} alt={user.name} />
```

Props: `seed`, `look` (a style object), `size`, `src`, `alt`, and every core option (`palette`, `finish`, `expression`, `body` and more).

Same seed, same avatar: from 1.0, the same seed and options give a byte-identical SVG in every 1.x release.

[Playground and docs](https://inlaylab.github.io/Opaline/) · [GitHub](https://github.com/Inlaylab/Opaline) · MIT for code and art.
