<script setup lang="ts">
import { gradient } from '@inlaylab/opaline/gradient'
import { Avatar } from '@inlaylab/opaline-vue'
import { PIXEL } from '../../../tools/ssr-e2e-pixel'
</script>

<template>
  <main>
    <Avatar seed="ada@inlay.dev" :look="gradient" :src="PIXEL" alt="Ada" />
    <Avatar seed="ada@inlay.dev" :look="gradient" />
  </main>
</template>
