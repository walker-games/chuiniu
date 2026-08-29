<script setup lang="ts">
defineProps<{
  value: number
}>()

const CDN = '/images/dice'
</script>

<template>
  <img
    :src="`${CDN}/dice-${value}.png`"
    :alt="`${value}`"
    class="w-12 h-12 rounded-lg select-none"
    style="filter: drop-shadow(0 2px 6px rgba(212, 168, 83, 0.2));"
  />
</template>
