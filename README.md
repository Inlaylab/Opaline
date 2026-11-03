# Opaline

Seeded avatars for every framework. The same seed always gives the same avatar. MIT for code and art.

## The name

Opaline is milky, softly glowing glass. Light goes in and comes back as color that seems to bloom from inside. That is the look we aim for: soft shapes, gentle gradients and light from one side, never hard edges.

Inlaylab names its projects after inlay materials. [Ivorie](https://github.com/Inlaylab/ivorie), our Angular UI library, is ivory: the base. Opaline is the colored glass set into it, the small bright piece that makes each surface personal. An avatar does the same job in an app.

## Status

Work in progress (0.3: Aura, Morph and Gradient, with Web Component, React, Angular, Vue and Svelte wrappers). The design lives in [docs/superpowers/specs/2026-11-03-avatar-design.md](docs/superpowers/specs/2026-11-03-avatar-design.md).

| Package                     | What                                                                           |
| --------------------------- | ------------------------------------------------------------------------------ |
| `@inlaylab/opaline`         | Core: seed to SVG, zero dependencies. Styles at `/aura`, `/morph`, `/gradient` |
| `@inlaylab/opaline-element` | `<opaline-avatar>` custom element, no framework                                |
| `@inlaylab/opaline-react`   | React `Avatar`, server-component safe                                          |
| `@inlaylab/opaline-angular` | Angular `op-avatar`, standalone, zoneless                                      |
| `@inlaylab/opaline-vue`     | Vue 3 `Avatar`, SSR safe                                                       |
| `@inlaylab/opaline-svelte`  | Svelte 5 `Avatar`, runes, SSR safe                                             |

### Several Vue apps on one page

The Vue `Avatar` takes its gradient IDs from Vue's `useId()`, which counts per app. A page with one Vue app needs nothing. If you mount several Vue apps on one page, give each a prefix so their IDs cannot clash:

```ts
app.config.idPrefix = 'sidebar'
```

## SSR samples

Each sample renders the same two avatars on the server and checks in a browser that hydration changes nothing:

| App                  | Framework                  |
| -------------------- | -------------------------- |
| `apps/ssr-next`      | Next (app router, RSC)     |
| `apps/ssr-angular`   | Angular SSR                |
| `apps/ssr-nuxt`      | Nuxt                       |
| `apps/ssr-sveltekit` | SvelteKit (`adapter-node`) |

Run them all with `pnpm build && pnpm e2e`.
