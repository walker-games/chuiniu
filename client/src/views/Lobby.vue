<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAuthStore } from '@/stores/auth'
import { useRoomStore } from '@/stores/room'
import PlayerSeat from '@/components/PlayerSeat.vue'
import QrShare from '@/components/QrShare.vue'
import type { WSMessage } from '@/types/ws'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const roomStore = useRoomStore()
const { connect, send, on } = useWebSocket()

const roomId = route.params.roomId as string
const isReady = ref(false)
const entering = ref(false)
const maxSeats = 8

const players = computed(() => roomStore.room?.players ?? [])
const inviteCode = computed(() => roomStore.room?.code ?? '')
const emptySeats = computed(() => {
  const count = maxSeats - players.value.length
  return count > 0 ? count : 0
})

function myPlayer() {
  return players.value.find((p) => p.id === authStore.user?.id)
}

function toggleReady() {
  isReady.value = !isReady.value
  send('ready', { ready: isReady.value })
}

onMounted(() => {
  connect(roomId, authStore.token, authStore.user?.name)

  on('room_state', (msg: WSMessage) => {
    roomStore.updateFromState(msg.data as typeof roomStore.room & object)
    const me = myPlayer()
    if (me) isReady.value = me.ready
  })

  on('player_left', (msg: WSMessage) => {
    const data = msg.data as { player_id: string }
    roomStore.removePlayer(data.player_id)
  })

  on('game_start', () => {
    entering.value = true
    setTimeout(() => router.push(`/game/${roomId}`), 500)
  })
})
</script>

<template>
  <div class="lobby-root">
    <!-- Header -->
    <div class="lobby-header animate-fade-up">
      <div class="flex items-center justify-between">
        <div class="flex items-baseline gap-2">
          <span class="text-gold-dim text-xs">{{ t('lobby.roomLabel') }}</span>
          <span class="text-gold font-serif-cn text-xl font-bold tracking-wider">{{ roomId.slice(0, 6) }}</span>
        </div>
        <span class="text-gold-dim text-xs">{{ t('lobby.playersCount', { current: players.length, max: maxSeats }) }}</span>
      </div>
      <p class="text-gold-dim text-xs mt-1.5 tracking-wider">{{ t('lobby.waitingToJoin') }}</p>
    </div>

    <!-- Players card -->
    <div class="lobby-card animate-fade-up stagger-1">
      <p class="card-label font-serif-cn">{{ t('lobby.playersCardTitle') }}</p>
      <div class="flex gap-3 justify-center flex-wrap py-2">
        <PlayerSeat
          v-for="(p, idx) in players"
          :key="p.id"
          :player="p"
          :is-host="p.id === roomStore.room?.host"
          :style="{ animationDelay: `${idx * 50}ms` }"
          class="animate-fade-up"
        />
        <PlayerSeat
          v-for="i in emptySeats"
          :key="'empty-' + i"
          empty
        />
      </div>
    </div>

    <!-- QR card -->
    <div class="lobby-card animate-fade-up stagger-2">
      <p class="card-label font-serif-cn">{{ t('lobby.inviteFriendCardTitle') }}</p>
      <div class="flex justify-center pt-1">
        <QrShare :invite-code="inviteCode" />
      </div>
    </div>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Ready button — always visible at bottom -->
    <div class="lobby-btn-area animate-fade-up stagger-3">
      <button
        v-if="!entering"
        class="lobby-ready-btn"
        :class="{ 'lobby-ready-btn--done': isReady }"
        @click="toggleReady"
      >
        <span class="font-serif-cn text-xl tracking-[0.2em]">{{ isReady ? t('lobby.cancelReady') : t('lobby.ready') }}</span>
      </button>
    </div>

    <!-- Entering overlay -->
    <div v-if="entering" class="absolute inset-0 z-50 flex flex-col items-center justify-center" style="background:#000000e6;">
      <div class="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mb-4" />
      <p class="text-gold font-serif-cn text-xl">{{ t('lobby.entering') }}</p>
    </div>
  </div>
</template>

<style scoped>
/* ── Gold palette ── */
.text-gold { color: #d4a853; }
.text-gold-dim { color: #8a7442; }
.border-gold { border-color: #d4a853; }

.lobby-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 12px 14px 16px;
  gap: 10px;
  background:
    radial-gradient(ellipse 80% 60% at 50% 38%, oklch(28% 0.06 60 / 0.9) 0%, transparent 70%),
    radial-gradient(ellipse at 50% 100%, oklch(20% 0.05 55) 0%, oklch(10% 0.02 55) 100%),
    #1a1508;
}

/* ── Header ── */
.lobby-header {
  padding: 12px 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #352a15, #2a2210);
  border: 1px solid #d4a85325;
}

/* ── Card ── */
.lobby-card {
  padding: 12px 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #352a15, #2a2210);
  border: 1px solid #d4a85320;
}

.card-label {
  font-size: 11px;
  letter-spacing: 0.15em;
  color: #8a7442;
  margin-bottom: 6px;
  padding-left: 2px;
}

/* ── Bottom button area ── */
.lobby-btn-area {
  padding: 8px 0 4px;
  /* safe area for iOS */
  padding-bottom: calc(4px + env(safe-area-inset-bottom, 0px));
}

.lobby-ready-btn {
  width: 100%;
  padding: 14px 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  font-size: 16px;

  /* Gold gradient */
  background: linear-gradient(180deg, #e8c050 0%, #c49a38 50%, #a07a20 100%);
  color: #1a1208;
  font-weight: 700;
  box-shadow:
    0 1px 0 #f0d880 inset,
    0 -1px 0 #886818 inset,
    0 4px 16px #c49a3860,
    0 0 30px #c49a3820;
  transition: transform 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 100ms;
}

.lobby-ready-btn:active {
  transform: scale(0.97) translateY(1px);
  box-shadow:
    0 1px 0 #dbb54c inset,
    0 -1px 0 #705510 inset,
    0 2px 8px #c49a3830;
}

/* Cancel state */
.lobby-ready-btn--done {
  background: linear-gradient(180deg, #3a3020, #2a2418);
  color: #8a7442;
  box-shadow:
    0 1px 0 #4a3e28 inset,
    0 2px 8px #00000030;
}
</style>
