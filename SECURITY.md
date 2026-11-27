# Security policy

## Supported versions

| Package                     | Version | Supported |
| --------------------------- | ------- | --------- |
| `@inlaylab/opaline`         | 1.x     | yes       |
| `@inlaylab/opaline-react`   | 1.x     | yes       |
| `@inlaylab/opaline-vue`     | 1.x     | yes       |
| `@inlaylab/opaline-svelte`  | 1.x     | yes       |
| `@inlaylab/opaline-angular` | 1.x     | yes       |
| `@inlaylab/opaline-element` | 1.x     | yes       |

Only the latest 1.x release gets security fixes. All six packages share one version, so update them together.

## Report a vulnerability

Do not open a public issue.

Report it privately through GitHub:
https://github.com/Inlaylab/Opaline/security/advisories/new

Include:

- the package and version
- the options or input that trigger it, or a minimal example
- the impact you expect

## What to expect

- We confirm receipt within 5 working days.
- We share a first assessment within 10 working days.
- We fix confirmed issues in a patch release and credit you in the advisory, unless you prefer not to be named.

Please give us time to ship a fix before you disclose the issue.

## Scope

In scope: the six published packages.

Every wrapper puts the core's SVG into the page as HTML (`dangerouslySetInnerHTML` in React, `{@html}` in Svelte, `innerHTML` in Vue and the web component, a trusted value in Angular). The core escapes every input that reaches the SVG, such as `seed`, `text` and `title`, and the wrappers escape `src` and `alt`. Any way to get markup or script through those inputs is a vulnerability, and so is a way to make one avatar's gradient IDs clash with another's to change what it draws.

Out of scope: the docs site, the sample apps in `apps/`, the private `@inlaylab/opaline-contract` test package, and issues in your own app, your framework or another dependency. Report those upstream.
