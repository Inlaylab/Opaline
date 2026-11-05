# @inlaylab/opaline-svelte

Seeded avatars for Svelte 5 and SvelteKit. Built with runes, SSR-safe.

```sh
npm i @inlaylab/opaline-svelte
```

```svelte
<script>
  import { Avatar } from '@inlaylab/opaline-svelte'
  import { clay } from '@inlaylab/opaline/clay'
</script>

<Avatar seed={user.email} look={clay} src={user.photo} alt={user.name} />
```

Props: `seed`, `look`, `size`, `src`, `alt`, and every core option.

Groups: `AvatarGroup` overlaps avatars and adds a `+N` chip past `max`.

```svelte
<AvatarGroup look={clay} members={[user.email, { seed: 'grace', src, alt: 'Grace' }]} max={4} />
```

Same seed, same avatar: from 1.0, the same seed and options give a byte-identical SVG in every 1.x release.

[Playground and docs](https://inlaylab.github.io/Opaline/) · [GitHub](https://github.com/Inlaylab/Opaline) · MIT for code and art.
