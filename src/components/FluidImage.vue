<script setup lang="ts">
import { ref } from 'vue'
import { useFluidImage } from '@/composables/useFluidImage'

const { src, alt, strength = 0.045 } = defineProps<{
  src: string
  alt: string
  strength?: number
}>()

const container = ref<HTMLElement | null>(null)
const img = ref<HTMLImageElement | null>(null)

useFluidImage(container, img, { strength })
</script>

<template>
  <div ref="container" class="relative h-full w-full overflow-hidden">
    <img
      ref="img"
      :src="src"
      :alt="alt"
      loading="lazy"
      crossorigin="anonymous"
      class="h-full w-full object-cover transition-opacity duration-500"
    />
  </div>
</template>
