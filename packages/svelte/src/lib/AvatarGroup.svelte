<script lang="ts">
  import { avatarGroup } from '@inlaylab/opaline'
  import Avatar from './Avatar.svelte'
  import type { AvatarGroupProps } from './types.js'

  let { members, max, alt, size = 40, ...options }: AvatarGroupProps = $props()
  const g = $derived(avatarGroup(members, { max, size, shape: options.shape }))
</script>

<span data-opaline-group="" role="group" aria-label={alt || undefined} style={g.css.root}>
  {#each g.shown as m, i (i)}
    <span data-opaline-member="" style={i ? g.css.member : g.css.first}>
      <Avatar {...options} {size} seed={m.seed} src={m.src} alt={m.alt} />
    </span>
  {/each}
  {#if g.rest}
    <span data-opaline-more="" role="img" aria-label="{g.rest} more" style={g.css.more}
      >+{g.rest}</span
    >
  {/if}
</span>
