<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  challengerName: string
}>()

const emit = defineEmits<{ done: [] }>()

const phase = ref<'flash' | 'text' | 'hidden'>('hidden')

watch(() => props.visible, (v) => {
  if (v) {
    phase.value = 'flash'
    setTimeout(() => { phase.value = 'text' }, 200)
    setTimeout(() => { phase.value = 'hidden'; emit('done') }, 2000)
  }
})
</script>

<template>
  <Teleport to="#app">
    <!-- White flash -->
    <div
      v-if="phase === 'flash' || phase === 'text'"
      class="absolute inset-0 z-50 pointer-events-none"
    >
      <div
        class="absolute inset-0 bg-white animate-challenge-flash"
      />
    </div>

    <!-- Challenge text -->
    <div
      v-if="phase === 'text'"
      class="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-shake-screen"
    >
      <div class="animate-challenge-slam flex flex-col items-center gap-3">
        <div class="challenge-main-text font-serif-cn font-bold text-cn-red text-center leading-none">
          {{ t('game.challengeButton') }}
        </div>
        <div class="text-cn-cream/60 text-lg font-serif-cn">
          {{ t('game.challengerCall', { name: challengerName }) }}
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.challenge-main-text {
  font-size: clamp(4rem, 20vw, 7rem);
  text-shadow:
    0 0 30px oklch(48% 0.2 25 / 0.6),
    0 0 60px oklch(48% 0.2 25 / 0.3),
    0 4px 8px rgba(0, 0, 0, 0.5);
}
</style>
