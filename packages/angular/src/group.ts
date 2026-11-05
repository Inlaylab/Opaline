import { ChangeDetectionStrategy, Component, computed, input, numberAttribute } from '@angular/core'
import {
  avatarGroup,
  type Finish,
  type GroupMember,
  type PaletteName,
  type Shape,
  type Style,
} from '@inlaylab/opaline'
import { OpalineAvatar } from './avatar'

/**
 * `<op-avatar-group [members]="people" [look]="clay" [max]="3" />`: overlapping avatars with a
 * `+N` chip for everyone past `max`.
 */
@Component({
  selector: 'op-avatar-group',
  imports: [OpalineAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-opaline-group': '',
    role: 'group',
    '[style]': 'g().css.root',
    '[attr.aria-label]': 'alt() || null',
    // Like <op-avatar>: static template attributes do not stay on the host.
    '[attr.alt]': 'null',
    '[attr.look]': 'null',
    '[attr.max]': 'null',
    '[attr.size]': 'null',
    '[attr.palette]': 'null',
    '[attr.shape]': 'null',
    '[attr.finish]': 'null',
  },
  template: `@for (m of g().shown; track $index) {
      <span data-opaline-member [style]="$index ? g().css.member : g().css.first">
        <op-avatar
          [seed]="m.seed"
          [src]="m.src"
          [alt]="m.alt"
          [look]="look()"
          [size]="size()"
          [palette]="palette()"
          [shape]="shape()"
          [finish]="finish()"
        />
      </span>
    }
    @if (g().rest) {
      <span
        data-opaline-more
        role="img"
        [attr.aria-label]="g().rest + ' more'"
        [style]="g().css.more"
        >+{{ g().rest }}</span
      >
    }`,
})
export class OpalineAvatarGroup {
  /** Seeds, or `{ seed, src, alt }` for a photo and an accessible name. */
  readonly members = input.required<readonly GroupMember[]>()
  readonly look = input.required<Style<any>>()
  /** Show at most this many avatars, then a `+N` chip. Shows everyone when unset. */
  readonly max = input(undefined, {
    transform: (v: unknown) => (v == null || v === '' ? undefined : numberAttribute(v)),
  })
  /** Pixel size of each avatar. Takes a number or a static attribute such as `size="32"`. */
  readonly size = input(40, { transform: numberAttribute })
  /** Accessible name for the whole group, e.g. "Project members". */
  readonly alt = input<string>()
  readonly palette = input<PaletteName>()
  readonly shape = input<Shape>()
  readonly finish = input<Finish>()

  protected readonly g = computed(() =>
    avatarGroup(this.members(), { max: this.max(), size: this.size(), shape: this.shape() }),
  )
}
