import { Component } from '@angular/core'
import { gradient } from '@inlaylab/opaline/gradient'
import { OpalineAvatar } from '@inlaylab/opaline-angular'
import { PIXEL } from '../../../../tools/ssr-e2e-pixel'

@Component({
  selector: 'app-root',
  imports: [OpalineAvatar],
  template: `
    <main>
      <op-avatar seed="ada@inlay.dev" [look]="gradient" [src]="pixel" alt="Ada" />
      <op-avatar seed="ada@inlay.dev" [look]="gradient" />
    </main>
  `,
})
export class App {
  protected readonly gradient = gradient
  protected readonly pixel = PIXEL
}
