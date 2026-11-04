# Opaline site: design

Approved 2026-11-04. The phase plan changed: Persona is dropped. The order is now (1) this site, (2) the same-input-same-image freeze, (3) packaging and v1.0.0.

## Intent

A public GitHub Pages site where people see Opaline, try it with their own name, and copy working code for their framework. It should have the feel of shadcn and Ivorie: neutral, calm, precise, light and dark. It is built in Astro, not Angular.

## Goals

- **Hero:** a big live avatar that redraws as you type a name, plus install and GitHub buttons.
- **Playground:**
  - Controls: seed, style (morph, gradient, aura, clay), finish, palette, expression, body (clay), shape (aura) and size.
  - Preview on light and dark.
  - Tabs: the snippet for each framework (Web Component, React, Vue, Svelte, Angular), the raw SVG, and the picks (`toJSON`).
  - Copy buttons, and Download SVG.
- **Gallery:** a 100-seed grid, switchable by style.
- **Docs:**
  - install and usage for each framework;
  - an options table;
  - theming with `--avatar-*` variables, with a live recolor demo;
  - the same-seed guarantee.
- **Theme:** light and dark from the system setting, with a toggle remembered per browser.
- **Deploy:** the GitHub Actions `actions/deploy-pages` workflow on every push to `main`. The site lives at `https://inlaylab.github.io/Opaline/`.

## Non-goals

- No Angular, React, Tailwind or component library in the site.
- No server, no analytics, no external fonts beyond Google Fonts.

## Anti-goals

- The playground shows anything other than real library output.
- The site breaks on phones (layout is checked at 375 px).

## Approaches

- **Plain Astro and CSS tokens, with a small script calling the core (chosen).** No new dependencies. The avatars are the real output.
- **Astro with Tailwind and shadcn React** was rejected: it adds React, Tailwind and Radix to a one-page site.
- **A separate React app** was rejected: two sites to maintain.

## Decided

- shadcn-style tokens as CSS variables: neutral greys, a 0.5 rem radius, 1 px borders, Inter for body text and JetBrains Mono for code.
- The playground uses `@inlaylab/opaline` and its style subpaths in the browser. The gallery uses the Web Component.
- Astro `base` is `/Opaline` for Pages.

## Left to the builder

- Section copy and the exact layout.
- A Playwright smoke test: typing a seed changes the preview, copy works, and there is no horizontal scroll at 375 px.

## Needs the user

- Enable GitHub Pages for the repo, with the source set to GitHub Actions.
