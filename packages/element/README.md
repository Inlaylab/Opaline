# @inlaylab/opaline-element

`<opaline-avatar>`: seeded avatars as a framework-free custom element.

```sh
npm i @inlaylab/opaline-element
```

```html
<script type="module">
  import '@inlaylab/opaline-element'
</script>

<opaline-avatar
  seed="ada@inlay.dev"
  look="clay"
  finish="gloss"
  size="64"
  alt="Ada"
></opaline-avatar>
```

Attributes: `seed`, `look` (`morph`, `gradient`, `aura`, `clay`, `plush`, `pip` or `initials`), `size`, `src`, `alt`, `palette`, `finish`, `expression`, `mood`, `face`, `family`, `backdrop`, `shape`, `body`, `ears`, `text`, `accessory` and `form`.

With `src`, the photo shows once it loads, and a failed photo leaves the generated avatar. With `alt`, the avatar has `role="img"`; without it, it is hidden from assistive tech.

Groups: wrap avatars in `<opaline-avatar-group>`. It overlaps them and shows a `+N` chip past `max`. Its `look`, `size`, `palette`, `shape` and `finish` are defaults for every child that does not set its own.

```html
<opaline-avatar-group look="clay" size="40" max="4" alt="Project members">
  <opaline-avatar seed="ada@inlay.dev" src="/ada.jpg" alt="Ada"></opaline-avatar>
  <opaline-avatar seed="grace@inlay.dev"></opaline-avatar>
</opaline-avatar-group>
```

Same seed, same avatar: from 1.0, the same seed and options give a byte-identical SVG in every 1.x release.

[Playground and docs](https://inlaylab.github.io/Opaline/) · [GitHub](https://github.com/Inlaylab/Opaline) · MIT for code and art.
