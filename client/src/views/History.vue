<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useRoomStore } from '@/stores/room'

const router = useRouter()
const roomStore = useRoomStore()
const { t } = useI18n()

const players = computed(() => {
  if (!roomStore.room?.players) return []
  return [...roomStore.room.players].sort((a, b) => b.score - a.score)
})
</script>

<template>
  <div class="min-h-screen flex flex-col px-4 py-6 bg-pattern">
    <!-- Header -->
    <div class="flex items-center mb-6 animate-fade-up">
      <button
        class="text-cn-muted text-sm active:text-cn-cream/50 transition-colors cursor-pointer
               flex items-center gap-1 min-w-11 min-h-11"
        @click="router.back()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        {{ t('history.back') }}
      </button>
      <h1 class="history-title flex-1 text-center font-serif-cn text-cn-gold font-bold">{{ t('history.title') }}</h1>
      <div class="w-11" />
    </div>

    <!-- Player list -->
    <div v-if="players.length" class="space-y-3">
      <div
        v-for="(p, index) in players"
        :key="p.id"
        class="flex items-center gap-4 px-4 py-3 rounded-xl surface-card animate-fade-up"
        :style="{ animationDelay: `${index * 50}ms` }"
      >
        <!-- Rank -->
        <span
          class="text-lg font-bold w-6 text-center font-serif-cn"
          :class="index === 0 ? 'text-cn-gold' : 'text-cn-muted'"
        >
          {{ index + 1 }}
        </span>

        <!-- Avatar -->
        <div
          class="w-11 h-11 rounded-full border-2 flex items-center justify-center
                 font-bold font-serif-cn"
          :class="index === 0
            ? 'border-cn-gold bg-cn-gold/10 text-cn-gold'
            : 'border-cn-cream/15 bg-cn-surface/60 text-cn-cream/40'"
        >
          {{ p.name?.charAt(0) || '?' }}
        </div>

        <!-- Name -->
        <span class="flex-1 text-cn-cream/60 truncate">{{ p.name }}</span>

        <!-- Score -->
        <span class="text-cn-gold font-serif-cn text-xl font-bold">{{ p.score }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex-1 flex flex-col items-center justify-center gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="text-cn-cream/8"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M16 8h.01"/><path d="M12 12h.01"/><path d="M8 16h.01"/></svg>
      <p class="text-cn-muted font-serif-cn text-lg">{{ t('history.empty') }}</p>
    </div>
  </div>
</template>

<style scoped>
.history-title {
  font-size: clamp(1.5rem, 5vw, 2rem);
}
</style>
