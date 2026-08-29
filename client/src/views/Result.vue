<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Button } from 'vant'
import 'vant/es/button/style'
import { useAuthStore } from '@/stores/auth'
import { useRoomStore } from '@/stores/room'
import { useGameStore } from '@/stores/game'
import DiceFace from '@/components/DiceFace.vue'
import PunishmentAnimation from '@/components/PunishmentAnimation.vue'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const roomStore = useRoomStore()
const gameStore = useGameStore()

const roomId = route.params.roomId as string
const showPunishment = ref(false)
const shaking = ref(false)

const result = computed(() => gameStore.challengeResult)
const players = computed(() => roomStore.room?.players ?? [])
const myId = computed(() => authStore.user?.id ?? '')

const challengerName = computed(() => {
  const p = players.value.find((pl) => pl.id === result.value?.challenger)
  return p?.name ?? t('common.unknown')
})

const targetName = computed(() => {
  const p = players.value.find((pl) => pl.id === result.value?.target)
  return p?.name ?? t('common.unknown')
})

const bidText = computed(() => {
  const bid = result.value?.bid
  if (!bid) return ''
  const modeText = bid.mode === 'fei' ? t('game.modeFei') : t('game.modeZhai')
  return t('result.bidDisplayTemplate', { count: bid.count, face: bid.face, mode: modeText })
})

const loserName = computed(() => {
  const p = players.value.find((pl) => pl.id === result.value?.loser)
  return p?.name ?? t('common.unknown')
})

const isWinner = computed(() => result.value?.winner === myId.value)

const punishmentKey = computed(() => gameStore.punishment?.punishment_key ?? '')
const punishmentText = computed(() => gameStore.punishment?.punishment_text ?? '')

function getPlayerName(id: string) {
  const p = players.value.find((pl) => pl.id === id)
  return p?.name ?? id.slice(0, 6)
}

function nextRound() {
  gameStore.reset()
  router.push(`/lobby/${roomId}`)
}

onMounted(() => {
  if (!result.value) {
    router.push(`/lobby/${roomId}`)
    return
  }
  // Screen shake on result reveal
  shaking.value = true
  setTimeout(() => { shaking.value = false }, 500)

  setTimeout(() => {
    if (punishmentKey.value || punishmentText.value) {
      showPunishment.value = true
    }
  }, 1500)
})
</script>

<template>
  <div
    class="min-h-screen flex flex-col px-4 py-6 bg-pattern"
    :class="{ 'animate-shake-screen': shaking }"
  >
    <!-- Header -->
    <h1 class="result-title font-serif-cn text-center mb-6 font-bold animate-fade-up">{{ t('result.title') }}</h1>

    <template v-if="result">
      <!-- Challenge info -->
      <div class="mb-4 py-3 surface-card px-4 space-y-1 animate-fade-up stagger-1">
        <p class="text-cn-cream/50 text-sm">
          <span class="text-cn-gold font-serif-cn">{{ targetName }}</span> {{ t('result.bidBy') }}
          <span class="text-cn-gold font-serif-cn text-lg font-bold">{{ bidText }}</span>
        </p>
        <p class="text-cn-cream/50 text-sm">
          <span class="text-cn-red font-serif-cn font-bold">{{ challengerName }}</span> {{ t('result.challengedBy') }}
        </p>
      </div>

      <!-- All dice revealed with bounce animation -->
      <div class="space-y-3 mb-6 animate-fade-up stagger-2">
        <div
          v-for="(dice, playerId) in result.allDice"
          :key="playerId"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          :class="[
            playerId === result.loser
              ? 'bg-cn-red/8 border border-cn-red/15 animate-loser-pulse'
              : playerId === result.winner
                ? 'surface-card animate-winner-glow'
                : 'surface-card'
          ]"
        >
          <span class="text-sm text-cn-cream/60 min-w-14 truncate font-serif-cn">
            {{ getPlayerName(playerId as string) }}
          </span>
          <div class="flex gap-1.5 flex-wrap">
            <div
              v-for="(d, i) in dice"
              :key="i"
              class="animate-dice-bounce"
              :style="{ animationDelay: `${i * 80}ms` }"
            >
              <DiceFace :value="d" />
            </div>
          </div>
        </div>
      </div>

      <!-- Actual count -->
      <div class="mb-4 animate-fade-up stagger-3">
        <span class="text-cn-muted text-sm">{{ t('result.actualCount') }}</span>
        <span class="text-cn-gold font-serif-cn text-2xl font-bold ml-2">{{ result.actualCount }}</span>
      </div>

      <!-- Win/lose with glow -->
      <div
        class="mb-8 animate-fade-up stagger-4 py-3 px-4 rounded-xl text-center"
        :class="isWinner ? 'animate-winner-glow' : 'animate-loser-pulse'"
      >
        <p
          class="font-serif-cn text-2xl font-bold"
          :class="isWinner ? 'text-cn-gold' : 'text-cn-red'"
        >
          {{ isWinner ? t('result.youWin') : t('result.youLose') }}
        </p>
      </div>
    </template>

    <!-- Next round -->
    <div class="mt-auto pb-6 flex justify-center">
      <Button
        class="result-next-btn"
        size="large"
        @click="nextRound"
      >
        <span class="font-serif-cn text-xl tracking-wider">{{ t('result.nextRound') }}</span>
      </Button>
    </div>

    <!-- Punishment overlay -->
    <PunishmentAnimation
      v-if="showPunishment && (punishmentKey || punishmentText)"
      :punish-key="punishmentKey"
      :text="punishmentText"
      :loser-name="loserName"
      @close="showPunishment = false"
    />
  </div>
</template>

<style scoped>
.result-title {
  font-size: clamp(1.75rem, 6vw, 2.5rem);
  color: oklch(72% 0.14 75);
}

.result-next-btn {
  width: 100%;
  max-width: 256px;
  height: 52px;
  border-radius: 14px;
  background: oklch(48% 0.2 25);
  border: 1.5px solid oklch(72% 0.14 75 / 0.3);
  color: oklch(72% 0.14 75);
  font-weight: bold;
  cursor: pointer;
  transition: transform 100ms cubic-bezier(0.16, 1, 0.3, 1), opacity 100ms;
}
.result-next-btn:active {
  transform: scale(0.97);
  opacity: 0.85;
}
</style>
