<script lang="ts">
  import { gradient } from '@inlaylab/opaline/gradient'
  import { Avatar } from '@inlaylab/opaline-svelte'
  import { PIXEL } from '../../../../tools/ssr-e2e-pixel'
</script>

<main>
  <Avatar seed="ada@inlay.dev" look={gradient} src={PIXEL} alt="Ada" />
  <Avatar seed="ada@inlay.dev" look={gradient} />
</main>
