<script lang="ts">
  import { createAvatar } from '@inlaylab/opaline'
  import Photo from './Photo.svelte'
  import type { AvatarProps } from './types.js'

  let { look, size = 64, src, alt, ...options }: AvatarProps = $props()
  // $props.id() matches on server and client, so hydration keeps the same gradient IDs.
  const instance = $props.id()
  // Safe to inject: the core escapes every input that reaches the SVG.
  const svg = $derived(createAvatar(look, { ...options, size, instance }).svg)
</script>

<span
  data-opaline=""
  style="display:inline-block;width:{size}px;height:{size}px;position:relative"
  role={alt ? 'img' : undefined}
  aria-label={alt || undefined}
  aria-hidden={alt ? undefined : 'true'}
>
  <span style="display:contents">{@html svg}</span>
  {#if src}
    {#key src}
      <Photo {src} />
    {/key}
  {/if}
</span>
