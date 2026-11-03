import { defineComponent, h, onMounted, ref } from 'vue'

const STYLE = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 'inherit',
} as const

/** The photo stays hidden until it loads; a failed load leaves the generated avatar. */
export const Photo = defineComponent({
  props: { src: { type: String, required: true } },
  setup(props) {
    const state = ref<'loading' | 'loaded' | 'error'>('loading')
    const img = ref<HTMLImageElement>()
    onMounted(() => {
      // With SSR the image can finish before hydration, so its load event is missed.
      if (img.value?.complete) state.value = img.value.naturalWidth > 0 ? 'loaded' : 'error'
    })
    return () =>
      state.value === 'error'
        ? null
        : h('img', {
            ref: img,
            src: props.src,
            alt: '',
            style: STYLE,
            hidden: state.value !== 'loaded',
            onLoad: () => (state.value = 'loaded'),
            onError: () => (state.value = 'error'),
          })
  },
})
