<script lang="ts">
  import type { GroupProps } from '@inlaylab/opaline-contract'
  import { aura } from '@inlaylab/opaline/aura'
  import { clay } from '@inlaylab/opaline/clay'
  import { gradient } from '@inlaylab/opaline/gradient'
  import { initials } from '@inlaylab/opaline/initials'
  import { pip } from '@inlaylab/opaline/pip'
  import { plush } from '@inlaylab/opaline/plush'
  import { morph } from '@inlaylab/opaline/morph'
  import AvatarGroup from '../src/lib/AvatarGroup.svelte'

  let { look = 'morph', ...rest }: GroupProps = $props()
</script>

<AvatarGroup look={{ morph, gradient, aura, clay, initials, plush, pip }[look]} {...rest} />
