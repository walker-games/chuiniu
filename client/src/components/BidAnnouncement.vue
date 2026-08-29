<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  text: string
  playerName: string
  visible: boolean
}>()

const emit = defineEmits<{ done: [] }>()

const phase = ref<'in' | 'out' | 'hidden'>('hidden')

watch(() => props.visible, (v) => {
  if (v) {
    phase.value = 'in'
    setTimeout(() => { phase.value = 'out' }, 1200)
    setTimeout(() => { phase.value = 'hidden'; emit('done') }, 1500)
  }
})
</script>

<template>
  <Teleport to="#app">
    <div
      v-if="phase !== 'hidden'"
      class="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      <div
        :class="phase === 'in' ? 'animate-bid-slam' : 'animate-bid-out'"
        class="flex flex-col items-center gap-2"
      >
        <div class="text-cn-gold font-serif-cn font-bold leading-tight text-center bid-main-text">
          {{ text }}
        </div>
        <div class="text-cn-cream/50 text-sm font-serif-cn">
          {{ playerName }}
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.bid-main-text {
  font-size: clamp(2rem, 10vw, 3.5rem);
  text-shadow:
    0 0 20px oklch(72% 0.14 75 / 0.4),
    0 0 40px oklch(72% 0.14 75 / 0.2);
}
</style>
