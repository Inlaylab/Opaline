import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core'
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser'
import {
  createAvatar,
  type AuraOptions,
  type BlobOptions,
  type ClayOptions,
  type Finish,
  type Expression,
  type Family,
  type Mood,
  type PaletteName,
  type Style,
} from '@inlaylab/opaline'
import { OpalineIds } from './ids'

type ImageState = 'loading' | 'loaded' | 'error'

/** `<op-avatar seed="ada@inlay.dev" [look]="morph" />`: a seeded avatar with an optional photo. */
@Component({
  selector: 'op-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-opaline': '',
    style: 'display:inline-block;position:relative',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[attr.role]': 'alt() ? "img" : null',
    '[attr.aria-label]': 'alt() || null',
    '[attr.aria-hidden]': 'alt() ? null : "true"',
    // Static template attributes (`seed="ada@inlay.dev"`) stay on the host; the seed is often an
    // email. Clear them so the root carries only the markup contract, on the server too.
    '[attr.seed]': 'null',
    '[attr.look]': 'null',
    '[attr.size]': 'null',
    '[attr.src]': 'null',
    '[attr.alt]': 'null',
    '[attr.palette]': 'null',
    '[attr.family]': 'null',
    '[attr.face]': 'null',
    '[attr.mood]': 'null',
    '[attr.expression]': 'null',
    '[attr.backdrop]': 'null',
    '[attr.shape]': 'null',
  },
  template: `<span style="display:contents" [innerHTML]="svg()"></span>
    @if (src() && state() !== 'error') {
      <img
        #img
        [src]="src()"
        alt=""
        style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit"
        [hidden]="state() !== 'loaded'"
        (load)="state.set('loaded')"
        (error)="state.set('error')"
      />
    }`,
})
export class OpalineAvatar {
  private readonly sanitizer = inject(DomSanitizer)
  // Unique per instance, so the same avatar twice on a page never shares gradient IDs.
  private readonly instance = inject(OpalineIds).next()
  private readonly img = viewChild<ElementRef<HTMLImageElement>>('img')

  readonly seed = input<string | number | null | undefined>()
  readonly look = input.required<Style<any>>()
  readonly size = input(64)
  readonly src = input<string>()
  readonly alt = input<string>()
  readonly palette = input<PaletteName>()
  readonly family = input<Family>()
  readonly face = input<boolean>()
  readonly mood = input<Mood>()
  readonly expression = input<Expression>()
  readonly backdrop = input<BlobOptions['backdrop']>()
  readonly shape = input<AuraOptions['shape']>()
  readonly finish = input<Finish>()
  readonly body = input<ClayOptions['body']>()
  readonly ears = input<ClayOptions['ears']>()

  protected readonly state = signal<ImageState>('loading')

  protected readonly svg = computed<SafeHtml>(() => {
    const svg = createAvatar(this.look(), {
      seed: this.seed(),
      size: this.size(),
      instance: this.instance,
      palette: this.palette(),
      family: this.family(),
      face: this.face(),
      mood: this.mood(),
      expression: this.expression(),
      backdrop: this.backdrop(),
      shape: this.shape(),
      finish: this.finish(),
      body: this.body(),
      ears: this.ears(),
    }).svg
    // Safe: the core escapes every input that reaches the SVG, and the default sanitizer strips SVG.
    return this.sanitizer.bypassSecurityTrustHtml(svg)
  })

  constructor() {
    // A new src is a new image: hide it until it loads.
    effect(() => {
      this.src()
      untracked(() => this.state.set('loading'))
    })
    // With SSR the image can finish before hydration, so its load event is missed. Read it once.
    afterNextRender(() => {
      const img = this.img()?.nativeElement
      if (img?.complete) this.state.set(img.naturalWidth > 0 ? 'loaded' : 'error')
    })
  }
}
