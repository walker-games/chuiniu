<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import DiceFace from './DiceFace.vue'

const { t } = useI18n()

defineProps<{
  dice: number[]
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Transition name="dice-viewer">
    <div
      v-if="visible"
      class="viewer-overlay"
      @click.self="emit('close')"
    >
      <!-- Backdrop -->
      <div class="viewer-backdrop" @click="emit('close')" />

      <!-- Sheet -->
      <div class="viewer-sheet">
        <div class="w-10 h-1 rounded-full mx-auto mb-4" style="background:#d4a85340;" />
        <p class="text-xs mb-4 font-serif-cn tracking-wider pl-1" style="color:#d4a85390;">{{ t('game.myDice') }}</p>
        <div class="flex justify-center gap-3 pb-2">
          <div
            v-for="(d, i) in dice"
            :key="i"
            class="animate-dice-bounce"
            :style="{ animationDelay: `${i * 100}ms` }"
          >
            <DiceFace :value="d" />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.viewer-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  /* Center within 430px on PC */
  max-width: 430px;
  margin: 0 auto;
  left: 0;
  right: 0;
}

.viewer-backdrop {
  position: absolute;
  inset: 0;
  background: #1a120880;
}

.viewer-sheet {
  position: relative;
  background: linear-gradient(180deg, #2a2010, #1e1808);
  border-top: 1px solid #d4a85320;
  border-radius: 16px 16px 0 0;
  padding: 16px 16px 20px;
}

.dice-viewer-enter-active,
.dice-viewer-leave-active {
  transition: opacity 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.dice-viewer-enter-active .viewer-sheet,
.dice-viewer-leave-active .viewer-sheet {
  transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.dice-viewer-enter-from,
.dice-viewer-leave-to {
  opacity: 0;
}
.dice-viewer-enter-from .viewer-sheet {
  transform: translateY(100%);
}
.dice-viewer-leave-to .viewer-sheet {
  transform: translateY(100%);
}
</style>
