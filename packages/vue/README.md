# @inlaylab/opaline-vue

Seeded avatars for Vue 3 and Nuxt. SSR-safe.

```sh
npm i @inlaylab/opaline-vue
```

```vue
<script setup>
import { Avatar } from '@inlaylab/opaline-vue'
import { clay } from '@inlaylab/opaline/clay'
</script>

<template>
  <Avatar :seed="user.email" :look="clay" :src="user.photo" :alt="user.name" />
</template>
```

Props: `seed`, `look`, `size`, `src`, `alt`, and every core option. If you mount several Vue apps on one page, give each `app.config.idPrefix` so their gradient IDs cannot clash.

Groups: `AvatarGroup` overlaps avatars and adds a `+N` chip past `max`.

```vue
<AvatarGroup :look="clay" :members="[user.email, { seed: 'grace', src, alt: 'Grace' }]" :max="4" />
```

Same seed, same avatar: from 1.0, the same seed and options give a byte-identical SVG in every 1.x release.

[Playground and docs](https://inlaylab.github.io/Opaline/) · [GitHub](https://github.com/Inlaylab/Opaline) · MIT for code and art.
