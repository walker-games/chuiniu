<script setup lang="ts">
import type { Player } from '@/types/game'

defineProps<{
  player?: Player
  isHost?: boolean
  empty?: boolean
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-1">
    <!-- Empty seat -->
    <template v-if="empty || !player">
      <div
        class="w-11 h-11 rounded-full border border-dashed border-cn-cream/8
               flex items-center justify-center text-cn-cream/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
      </div>
    </template>

    <!-- Occupied seat -->
    <template v-else>
      <div class="relative">
        <div
          class="w-11 h-11 rounded-full border-2 flex items-center justify-center
                 text-sm font-bold font-serif-cn transition-colors duration-200"
          :class="player.ready
            ? 'border-cn-gold bg-cn-gold/10 text-cn-gold'
            : 'border-cn-cream/15 bg-cn-surface/60 text-cn-cream/40'"
        >
          {{ player.name?.charAt(0) || '?' }}
        </div>
        <!-- Host badge: small gold dot -->
        <div
          v-if="isHost"
          class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-cn-gold"
        />
      </div>
      <span class="text-[10px] text-cn-cream/50 truncate max-w-12 text-center leading-tight">
        {{ player.name }}
      </span>
    </template>
  </div>
</template>
