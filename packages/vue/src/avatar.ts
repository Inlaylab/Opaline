import { createAvatar, type AuraOptions, type ClayOptions, type Style } from '@inlaylab/opaline'
import { computed, defineComponent, h, useId, type PropType } from 'vue'
import { Photo } from './photo.ts'

export type AvatarProps = {
  seed: string | number | null | undefined
  /** The style object, e.g. `morph` from `@inlaylab/opaline/morph`. */
  look: Style<any>
  size?: number
  /** Photo to show over the generated avatar once it loads. */
  src?: string
  /** Accessible name. Without it the avatar is decorative and hidden from assistive tech. */
  alt?: string
} & ClayOptions &
  AuraOptions

export const Avatar = defineComponent({
  name: 'OpalineAvatar',
  inheritAttrs: false,
  props: {
    seed: { type: [String, Number, null] as PropType<AvatarProps['seed']>, default: undefined },
    look: { type: Object as PropType<Style<any>>, required: true },
    size: { type: Number, default: 64 },
    src: String,
    alt: String,
  },
  setup(props, { attrs }) {
    // useId matches on server and client, so hydration keeps the same gradient IDs.
    const instance = useId()
    const svg = computed(
      () =>
        createAvatar(props.look, {
          ...(attrs as ClayOptions & AuraOptions),
          seed: props.seed,
          size: props.size,
          instance,
        }).svg,
    )
    return () =>
      h(
        'span',
        {
          'data-opaline': '',
          style: {
            display: 'inline-block',
            width: `${props.size}px`,
            height: `${props.size}px`,
            position: 'relative',
          },
          ...(props.alt ? { role: 'img', 'aria-label': props.alt } : { 'aria-hidden': 'true' }),
        },
        [
          // Safe: the core escapes every input that reaches the SVG.
          h('span', { style: { display: 'contents' }, innerHTML: svg.value }),
          props.src ? h(Photo, { key: props.src, src: props.src }) : null,
        ],
      )
  },
})
