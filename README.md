# Opaline

Seeded avatars for every framework. The same seed always gives the same avatar. MIT for code and art.

## The name

Opaline is milky, softly glowing glass. Light goes in and comes back as color that seems to bloom from inside. That is the look we aim for: soft shapes, gentle gradients and light from one side, never hard edges.

Inlaylab names its projects after inlay materials. [Ivorie](https://github.com/Inlaylab/ivorie), our Angular UI library, is ivory: the base. Opaline is the colored glass set into it, the small bright piece that makes each surface personal. An avatar does the same job in an app.

## Status

Work in progress (0.2: Aura, Morph and Gradient, with Web Component, React and Angular wrappers). The design lives in [docs/superpowers/specs/2026-11-03-avatar-design.md](docs/superpowers/specs/2026-11-03-avatar-design.md).

| Package                     | What                                                                           |
| --------------------------- | ------------------------------------------------------------------------------ |
| `@inlaylab/opaline`         | Core: seed to SVG, zero dependencies. Styles at `/aura`, `/morph`, `/gradient` |
| `@inlaylab/opaline-element` | `<opaline-avatar>` custom element, no framework                                |
| `@inlaylab/opaline-react`   | React `Avatar`, server-component safe                                          |
| `@inlaylab/opaline-angular` | Angular `op-avatar`, standalone, zoneless                                      |
