# @inlaylab/opaline-angular

Seeded avatars for Angular: a standalone, zoneless, SSR-safe component with signal inputs.

```sh
npm i @inlaylab/opaline-angular
```

```ts
import { Component } from '@angular/core'
import { OpalineAvatar } from '@inlaylab/opaline-angular'
import { clay } from '@inlaylab/opaline/clay'

@Component({
  selector: 'app-user-avatar',
  imports: [OpalineAvatar],
  template: `<op-avatar [seed]="email" [look]="clay" [src]="photo" alt="Ada" />`,
})
export class UserAvatar {
  protected readonly clay = clay
  email = 'ada@inlay.dev'
  photo?: string
}
```

Inputs: `seed`, `look`, `size`, `src`, `alt`, `palette`, `finish`, `expression`, `mood`, `face`, `family`, `backdrop`, `shape`, `body`, `ears` and `text`. Works with Angular 20 to 22.

Groups: `OpalineAvatarGroup` (`<op-avatar-group>`) overlaps avatars and adds a `+N` chip past `max`. Inputs: `members` (seeds or `{ seed, src, alt }`), `look`, `max`, `size`, `alt`, `palette`, `shape` and `finish`.

```html
<op-avatar-group [members]="people" [look]="clay" max="4" alt="Project members" />
```

Same seed, same avatar: from 1.0, the same seed and options give a byte-identical SVG in every 1.x release.

[Playground and docs](https://inlaylab.github.io/Opaline/) · [GitHub](https://github.com/Inlaylab/Opaline) · MIT for code and art.
