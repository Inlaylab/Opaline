<script lang="ts">
  import type { Props } from '@inlaylab/opaline-contract'
  import { aura } from '@inlaylab/opaline/aura'
  import { gradient } from '@inlaylab/opaline/gradient'
  import { morph } from '@inlaylab/opaline/morph'
  import Avatar from '../src/lib/Avatar.svelte'

  let { initial }: { initial: Props } = $props()
  // The test replaces these props after mount to check updates.
  // svelte-ignore state_referenced_locally
  export const state = $state({ props: initial })
  const view = $derived.by(() => {
    const { look = 'morph', ...rest } = state.props
    return { look: { morph, gradient, aura }[look], ...rest }
  })
</script>

<Avatar {...view} />
