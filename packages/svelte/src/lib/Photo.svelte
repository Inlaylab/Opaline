<script lang="ts">
  import { onMount } from 'svelte'

  let { src }: { src: string } = $props()
  let status = $state<'loading' | 'loaded' | 'error'>('loading')
  let img = $state<HTMLImageElement>()

  onMount(() => {
    // With SSR the image can finish before hydration, so its load event is missed.
    if (img?.complete) status = img.naturalWidth > 0 ? 'loaded' : 'error'
  })
</script>

<!-- The photo stays hidden until it loads; a failed load leaves the generated avatar. -->
{#if status !== 'error'}
  <img
    bind:this={img}
    {src}
    alt=""
    style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit"
    hidden={status !== 'loaded'}
    onload={() => (status = 'loaded')}
    onerror={() => (status = 'error')}
  />
{/if}
