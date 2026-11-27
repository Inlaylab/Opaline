import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
  untracked,
  viewChild,
} from '@angular/core'
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser'
import {
  createAvatar,
  statusLabel,
  type Accessory,
  type BlobOptions,
  type ClayOptions,
  type LookOptions,
  type Family,
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
    '[attr.aria-label]': 'label()',
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
    '[attr.text]': 'null',
    '[attr.finish]': 'null',
    '[attr.material]': 'null',
    '[attr.body]': 'null',
    '[attr.ears]': 'null',
    '[attr.accessory]': 'null',
    '[attr.form]': 'null',
    '[attr.animal]': 'null',
    '[attr.coat]': 'null',
    '[attr.object]': 'null',
    '[attr.tone]': 'null',
    '[attr.scheme]': 'null',
    '[attr.status]': 'null',
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
  readonly mood = input<LookOptions['mood']>()
  readonly expression = input<LookOptions['expression']>()
  readonly backdrop = input<BlobOptions['backdrop']>()
  /** Tile outline; Folk and Doodle also take `none`. */
  readonly shape = input<LookOptions['shape']>()
  readonly finish = input<LookOptions['finish']>()
  /** Plush only: `gummy` (default), `flat` or `soft`. Plush ignores `finish`. */
  readonly material = input<LookOptions['material']>()
  readonly body = input<ClayOptions['body']>()
  readonly ears = input<ClayOptions['ears']>()
  /** Initials only: letters to show instead of the ones from the seed. */
  readonly text = input<string>()
  /** Plush only: something the critter wears. */
  readonly accessory = input<Accessory>()
  /** Pip and Gradient: the body outline. */
  readonly form = input<LookOptions['form']>()
  /** Critters only. */
  readonly animal = input<LookOptions['animal']>()
  readonly coat = input<LookOptions['coat']>()
  /** Cosmos only: the object and its colour theme. */
  readonly object = input<LookOptions['object']>()
  readonly tone = input(undefined, {
    transform: (v: unknown) => (v == null || v === '' ? undefined : numberAttribute(v)),
  })
  /** Folk and Doodle: the colour look. */
  readonly scheme = input<LookOptions['scheme']>()
  /** A presence badge; with `alt` it is read out too, e.g. `Ada (away)`. */
  readonly status = input<LookOptions['status']>()

  protected readonly label = computed(() => {
    const alt = this.alt()
    return alt ? statusLabel(alt, this.status()) : null
  })

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
      material: this.material(),
      body: this.body(),
      ears: this.ears(),
      text: this.text(),
      accessory: this.accessory(),
      form: this.form(),
      animal: this.animal(),
      coat: this.coat(),
      object: this.object(),
      tone: this.tone(),
      scheme: this.scheme(),
      status: this.status(),
    } as never).svg
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
