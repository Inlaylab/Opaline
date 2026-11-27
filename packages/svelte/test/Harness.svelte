<script lang="ts">
  import type { Props } from '@inlaylab/opaline-contract'
  import { aura } from '@inlaylab/opaline/aura'
  import { clay } from '@inlaylab/opaline/clay'
  import { cosmos } from '@inlaylab/opaline/cosmos'
  import { critters } from '@inlaylab/opaline/critters'
  import { doodle } from '@inlaylab/opaline/doodle'
  import { folk } from '@inlaylab/opaline/folk'
  import { gradient } from '@inlaylab/opaline/gradient'
  import { initials } from '@inlaylab/opaline/initials'
  import { pip } from '@inlaylab/opaline/pip'
  import { plush } from '@inlaylab/opaline/plush'
  import { morph } from '@inlaylab/opaline/morph'
  import Avatar from '../src/lib/Avatar.svelte'

  let { initial }: { initial: Props } = $props()
  // The test replaces these props after mount to check updates.
  // svelte-ignore state_referenced_locally
  export const state = $state({ props: initial })
  const view = $derived.by(() => {
    const { look = 'morph', ...rest } = state.props
    return { look: { morph, gradient, aura, clay, initials, plush, pip, critters, cosmos, folk, doodle }[look], ...rest }
  })
</script>

<Avatar {...view} />
