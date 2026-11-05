import { avatarGroup, type GroupMember, type Shape, type Style } from '@inlaylab/opaline'
import { defineComponent, h, type PropType } from 'vue'
import { Avatar, type AvatarProps } from './avatar.ts'

export type AvatarGroupProps = Omit<AvatarProps, 'seed' | 'src' | 'alt'> & {
  /** Seeds, or `{ seed, src, alt }` for a photo and an accessible name. */
  members: readonly GroupMember[]
  /** Show at most this many avatars, then a `+N` chip. Shows everyone when unset. */
  max?: number
  /** Accessible name for the whole group, e.g. "Project members". */
  alt?: string
}

/** Overlapping avatars with a `+N` chip. Style options (`palette`, `shape`, …) reach every avatar. */
export const AvatarGroup = defineComponent({
  name: 'OpalineAvatarGroup',
  inheritAttrs: false,
  props: {
    members: { type: Array as PropType<readonly GroupMember[]>, required: true },
    look: { type: Object as PropType<Style<any>>, required: true },
    size: { type: Number, default: 40 },
    max: Number,
    alt: String,
  },
  setup(props, { attrs }) {
    return () => {
      const g = avatarGroup(props.members, {
        max: props.max,
        size: props.size,
        shape: attrs.shape as Shape | undefined,
      })
      return h(
        'span',
        {
          'data-opaline-group': '',
          role: 'group',
          'aria-label': props.alt || undefined,
          style: g.css.root,
        },
        [
          ...g.shown.map((m, i) =>
            h(
              'span',
              { key: i, 'data-opaline-member': '', style: i ? g.css.member : g.css.first },
              [
                h(Avatar, {
                  ...attrs,
                  look: props.look,
                  size: props.size,
                  seed: m.seed,
                  src: m.src,
                  alt: m.alt,
                }),
              ],
            ),
          ),
          g.rest
            ? h(
                'span',
                {
                  'data-opaline-more': '',
                  role: 'img',
                  'aria-label': `${g.rest} more`,
                  style: g.css.more,
                },
                `+${g.rest}`,
              )
            : null,
        ],
      )
    }
  },
})
