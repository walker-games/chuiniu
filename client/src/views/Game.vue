<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAuthStore } from '@/stores/auth'
import { useRoomStore } from '@/stores/room'
import { useGameStore } from '@/stores/game'
import { useAudio } from '@/composables/useAudio'
import ChatFeed from '@/components/ChatFeed.vue'
import BidInput from '@/components/BidInput.vue'
import DiceViewer from '@/components/DiceViewer.vue'
import BidAnnouncement from '@/components/BidAnnouncement.vue'
import ChallengeOverlay from '@/components/ChallengeOverlay.vue'
import type { WSMessage, RollResultData, PunishmentData } from '@/types/ws'
import type { ChatMessage } from '@/types/game'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const roomStore = useRoomStore()
const gameStore = useGameStore()
const { connected, connect, send, on } = useWebSocket()
const { play, muted, toggleMuted } = useAudio()

const roomId = route.params.roomId as string
const myId = computed(() => authStore.user?.id ?? '')
const isMyTurn = computed(() => gameStore.currentTurn === myId.value)
const players = computed(() => roomStore.room?.players ?? [])
const playerCount = computed(() => players.value.length)
const roundNumber = computed(() => roomStore.room?.round?.number ?? 1)

const messages = ref<ChatMessage[]>([])
const showDice = ref(false)
const hasRolled = ref(false)
const showNextRound = ref(false)
const isShaking = ref(false)
const eyeBtn = ref<HTMLDivElement | null>(null)
const botCue = ref('')

// Bid announcement state
const bidAnnounce = ref({ visible: false, text: '', playerName: '' })

// Challenge overlay state
const challengeOverlay = ref({ visible: false, challengerName: '' })

// Draggable eye button
let eyeDragging = false
let eyeMoved = false
let eyeStartX = 0, eyeStartY = 0, eyeOrigLeft = 0, eyeOrigTop = 0

function onEyeTouchStart(e: TouchEvent) {
  eyeDragging = true; eyeMoved = false
  eyeStartX = e.touches[0].clientX; eyeStartY = e.touches[0].clientY
  if (eyeBtn.value) {
    const r = eyeBtn.value.getBoundingClientRect()
    eyeOrigLeft = r.left; eyeOrigTop = r.top
  }
}
function onEyeTouchMove(e: TouchEvent) {
  if (!eyeDragging || !eyeBtn.value) return
  const dx = e.touches[0].clientX - eyeStartX
  const dy = e.touches[0].clientY - eyeStartY
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) eyeMoved = true
  eyeBtn.value.style.left = Math.max(4, Math.min(window.innerWidth - 52, eyeOrigLeft + dx)) + 'px'
  eyeBtn.value.style.top = Math.max(4, Math.min(window.innerHeight - 52, eyeOrigTop + dy)) + 'px'
  eyeBtn.value.style.right = 'auto'
  eyeBtn.value.style.bottom = 'auto'
}
function onEyeTouchEnd() {
  eyeDragging = false
  if (!eyeMoved) showDice.value = !showDice.value
}
function onEyeMouseDown(e: MouseEvent) {
  eyeDragging = true; eyeMoved = false
  eyeStartX = e.clientX; eyeStartY = e.clientY
  if (eyeBtn.value) {
    const r = eyeBtn.value.getBoundingClientRect()
    eyeOrigLeft = r.left; eyeOrigTop = r.top
  }
  const onMove = (ev: MouseEvent) => {
    if (!eyeDragging || !eyeBtn.value) return
    const dx = ev.clientX - eyeStartX, dy = ev.clientY - eyeStartY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) eyeMoved = true
    eyeBtn.value.style.left = Math.max(4, Math.min(window.innerWidth - 52, eyeOrigLeft + dx)) + 'px'
    eyeBtn.value.style.top = Math.max(4, Math.min(window.innerHeight - 52, eyeOrigTop + dy)) + 'px'
    eyeBtn.value.style.right = 'auto'; eyeBtn.value.style.bottom = 'auto'
  }
  const onUp = () => {
    eyeDragging = false
    if (!eyeMoved) showDice.value = !showDice.value
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

let msgCounter = 0
function addMsg(type: ChatMessage['type'], text: string, playerId?: string, playerName?: string) {
  messages.value.push({
    id: `msg-${++msgCounter}`,
    type,
    playerId,
    playerName,
    text,
    timestamp: Date.now(),
  })
}

function getPlayerName(id: string): string {
  const p = players.value.find((pl) => pl.id === id)
  return p?.name ?? '???'
}

const currentTurnName = computed(() => getPlayerName(gameStore.currentTurn))

function triggerShake() {
  isShaking.value = true
  setTimeout(() => { isShaking.value = false }, 500)
}

function handleRoll() {
  console.log('[Game] handleRoll, connected:', connected.value, 'phase:', gameStore.phase)
  send('roll', {})
  play('shake')
  isShaking.value = false // reset for re-trigger
}

function handleBid(payload: { count: number; face: number; mode: 'fei' | 'zhai' }) {
  send('bid', payload)
  play('bid')
}

function handleChallenge() {
  send('challenge', {})
  play('challenge')
}

function handleNextRound() {
  gameStore.reset()
  hasRolled.value = false
  showNextRound.value = false
  addMsg('system', t('game.newRound'))
  send('ready', { ready: true })
}

function leaveTable() { router.push('/') }

onMounted(() => {
  connect(roomId, authStore.token, authStore.user?.name)

  addMsg('system', t('game.systemEnterRoom'))

  on('room_state', (msg: WSMessage) => {
    console.log('[Game] room_state received, phase:', (msg.data as any)?.round?.phase, 'players:', (msg.data as any)?.players?.length)
    const data = msg.data as typeof roomStore.room & object
    const prevPlayers = players.value.map((p) => ({ id: p.id, rolled: p.rolled }))
    roomStore.updateFromState(data)

    if (data.round) {
      gameStore.setPhase(data.round.phase)
      if (data.round.current_bid) {
        gameStore.setBid(data.round.current_bid)
      }
      const turnId = data.round.turn_order?.[data.round.turn_index]
      if (turnId) gameStore.setTurn(turnId)
    }

    if (data.players) {
      for (const p of data.players) {
        if (p.id === myId.value) continue
        const prev = prevPlayers.find((pp) => pp.id === p.id)
        if (p.rolled && (!prev || !prev.rolled)) {
          addMsg('roll', '', p.id, p.name)
        }
      }
    }
  })

  on('roll_result', (msg: WSMessage) => {
    console.log('[Game] roll_result received:', (msg.data as any)?.dice)
    const data = msg.data as RollResultData
    gameStore.setDice(data.dice)
    hasRolled.value = true
    play('reveal')
    addMsg('roll', '', myId.value, t('common.you'))
  })

  on('game_start', () => {
    gameStore.reset()
    hasRolled.value = false
    showNextRound.value = false
    addMsg('system', t('game.roundStarted', { n: roundNumber.value }))
  })

  on('all_rolled', () => {
    gameStore.setPhase('bidding')
    addMsg('system', t('game.allReady'))
  })

  on('bid_made', (msg: WSMessage) => {
    const data = msg.data as any
    gameStore.setBid({
      player_id: data.player_id,
      count: data.count,
      face: data.face,
      mode: data.mode as 'fei' | 'zhai',
    })
    const name = getPlayerName(data.player_id)
    const modeText = data.mode === 'fei' ? t('game.modeFei') : t('game.modeZhai')
    addMsg('bid', t('result.bidDisplayTemplate', { count: data.count, face: data.face, mode: modeText }), data.player_id, name)

    // Show bid announcement overlay
    bidAnnounce.value = {
      visible: true,
      text: t('result.bidDisplayTemplate', { count: data.count, face: data.face, mode: modeText }),
      playerName: name,
    }
    if (data.player_id !== myId.value) play('bid')
  })

  on('turn_change', (msg: WSMessage) => {
    const data = msg.data as any
    const turnId = data.turn_player_id || data.playerId
    gameStore.setTurn(turnId)
    const name = getPlayerName(turnId)
    addMsg('system', t('game.turnOf', { name }))
  })

  on('voice_cue', (msg: WSMessage) => {
    const data = msg.data as { actor_id?: string; cue?: string }
    if (!data.actor_id) return
    botCue.value = t('game.botThinking', { name: getPlayerName(data.actor_id) })
    setTimeout(() => { botCue.value = '' }, 1800)
  })

  on('challenge_result', (msg: WSMessage) => {
    const data = msg.data as any
    gameStore.setPhase('settling')

    const challengerName = getPlayerName(data.challenger)
    const bidder = data.bid?.player_id || data.bid?.PlayerID || ''
    const bidderName = getPlayerName(bidder)

    // Store challenge result for Result page
    gameStore.challengeResult = {
      challenger: data.challenger,
      target: bidder,
      bid: {
        player_id: bidder,
        count: data.bid?.count,
        face: data.bid?.face,
        mode: data.bid?.mode,
      },
      allDice: data.all_dice,
      actualCount: data.actual_count,
      winner: data.winner,
      loser: data.loser,
    }

    addMsg('challenge', '', data.challenger, challengerName)

    // Show challenge overlay with dramatic effect
    challengeOverlay.value = {
      visible: true,
      challengerName: challengerName,
    }
    triggerShake()

    const modeText = data.bid?.mode === 'fei' ? t('game.modeFei') : t('game.modeZhai')
    const bidText = t('result.bidDisplayTemplate', { count: data.bid?.count, face: data.bid?.face, mode: modeText })
    const winnerName = getPlayerName(data.winner)
    const loserName = getPlayerName(data.loser)
    addMsg('result', t('game.challengeCall', { challenger: challengerName, bidder: bidderName }))
    addMsg('result', t('game.challengeBid', { bid: bidText }))
    addMsg('result', t('game.challengeActual', { count: data.actual_count }))
    addMsg('result', t('game.challengeResult', { winner: winnerName, loser: loserName }))
    play('challenge')
  })

  on('error', (msg: WSMessage) => {
    const data = msg.data as { code: string; params?: Record<string, unknown> }
    if (!data?.code) return
    const text = t(data.code, (data.params ?? {}) as Record<string, unknown>)
    addMsg('system', text)
  })

  on('punishment', (msg: WSMessage) => {
    const data = msg.data as PunishmentData
    const name = getPlayerName(data.loser)
    const punishText = t(data.punishment_key) || data.punishment_text

    // Store punishment for Result page
    gameStore.punishment = data

    addMsg('result', t('game.punishmentMsg', { name, text: punishText }))
    play('punishment')
    showNextRound.value = true
  })

  on('player_left', (msg: WSMessage) => {
    const data = msg.data as any
    const name = getPlayerName(data.player_id)
    addMsg('system', t('game.playerLeftMsg', { name }))
  })

  on('round_end', (_msg: WSMessage) => {
    showNextRound.value = true
  })
})
</script>

<template>
  <div
    class="game-shell"
    :class="{ 'animate-shake-screen': isShaking }"
  >
    <!-- Top bar -->
    <div class="game-topbar shrink-0">
      <span class="font-serif-cn topbar-round">{{ t('game.roundN', { n: roundNumber }) }}</span>
      <span class="topbar-players">{{ t('game.playersTotal', { n: playerCount }) }}</span>
      <button class="topbar-sound" type="button" :aria-label="muted ? '开启音效' : '关闭音效'" @click="toggleMuted">{{ muted ? '🔇' : '🔊' }}</button>
      <button class="topbar-exit" type="button" @click="leaveTable">{{ t('common.leaveTable') }}</button>
    </div>

    <div class="table-players" aria-label="players">
      <div v-for="player in players" :key="player.id" class="table-player" :class="{ 'table-player--turn': player.id === gameStore.currentTurn, 'table-player--bot': player.is_bot }">
        <span class="table-avatar">{{ player.is_bot ? '🦊' : '🙂' }}</span>
        <span>{{ player.id === myId ? t('common.you') : player.name }}</span>
        <i v-if="player.rolled" class="table-ready">●</i>
      </div>
    </div>
    <div v-if="botCue" class="bot-cue">{{ botCue }}</div>

    <!-- Chat feed -->
    <ChatFeed :messages="messages" />

    <!-- Bottom area -->
    <div class="shrink-0">
      <!-- Rolling phase: roll button -->
      <div
        v-if="gameStore.phase === 'rolling' && !hasRolled"
        class="px-4 py-3 flex justify-center"
      >
        <button
          class="game-roll-btn group"
          @click="handleRoll"
        >
          <div class="roll-btn-inner">
            <span class="roll-btn-icon">🎲</span>
            <span class="font-serif-cn roll-btn-text tracking-widest">{{ t('game.rollButton') }}</span>
          </div>
        </button>
      </div>

      <!-- Rolling phase: waiting for others -->
      <div
        v-else-if="gameStore.phase === 'rolling' && hasRolled"
        class="wait-bar"
      >
        <div class="animate-dice-wobble wait-icon">🎲</div>
        <span class="wait-text font-serif-cn">{{ t('game.waitingOthersRoll') }}</span>
      </div>

      <!-- Bidding phase: my turn -->
      <div v-else-if="gameStore.phase === 'bidding' && isMyTurn">
        <BidInput
          :min-count="gameStore.currentBid ? gameStore.currentBid.count : 1"
          :max-count="playerCount * 5"
          :previous-bid="gameStore.currentBid"
          :player-count="playerCount"
          @bid="handleBid"
          @challenge="handleChallenge"
        />
      </div>

      <!-- Bidding phase: not my turn -->
      <div
        v-else-if="gameStore.phase === 'bidding' && !isMyTurn"
        class="wait-bar"
      >
        <div class="wait-dots">
          <span class="dot" /><span class="dot" /><span class="dot" />
        </div>
        <span class="wait-text font-serif-cn">
          {{ t('game.waitingPlayer', { name: currentTurnName }) }}
        </span>
      </div>

      <!-- Settling phase: next round button -->
      <div v-else-if="showNextRound" class="px-4 py-3">
        <button
          class="game-next-btn"
          @click="handleNextRound"
        >
          <span class="font-serif-cn text-lg font-bold">{{ t('game.nextRound') }}</span>
        </button>
      </div>
    </div>

    <!-- Draggable eye button -->
    <div
      v-if="hasRolled && gameStore.phase !== 'rolling'"
      ref="eyeBtn"
      class="eye-fab select-none cursor-pointer"
      style="right: 12px; bottom: 160px; touch-action: none;"
      @touchstart.prevent="onEyeTouchStart"
      @touchmove.prevent="onEyeTouchMove"
      @touchend="onEyeTouchEnd"
      @mousedown.prevent="onEyeMouseDown"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4a853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
    </div>

    <!-- Dice viewer bottom sheet -->
    <DiceViewer
      :dice="gameStore.myDice"
      :visible="showDice"
      @close="showDice = false"
    />

    <!-- Bid announcement overlay -->
    <BidAnnouncement
      :text="bidAnnounce.text"
      :player-name="bidAnnounce.playerName"
      :visible="bidAnnounce.visible"
      @done="bidAnnounce.visible = false"
    />

    <!-- Challenge dramatic overlay -->
    <ChallengeOverlay
      :visible="challengeOverlay.visible"
      :challenger-name="challengeOverlay.challengerName"
      @done="challengeOverlay.visible = false"
    />
  </div>
</template>

<style scoped>
/* ── Game shell ── */
.game-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: radial-gradient(ellipse 100% 48% at 50% 15%, #ff4fa450 0%, transparent 66%), radial-gradient(ellipse 90% 50% at 50% 100%, #23c8df42 0%, transparent 70%), linear-gradient(180deg,#28114a,#120b2d 70%,#1b0c37);
  overflow: hidden;
}
.game-shell::before { content:''; position:absolute; inset:0; pointer-events:none; opacity:.24; background-image:radial-gradient(circle,#fff8 0 1px,transparent 1.5px); background-size:32px 32px; animation:table-stars 14s linear infinite; }
.game-shell::after { content:''; position:absolute; width:280px; height:280px; right:-130px; top:24%; border-radius:50%; background:#ff3b9a44; filter:blur(50px); pointer-events:none; animation:table-glow 3.5s ease-in-out infinite alternate; }
@keyframes table-stars { to { transform:translateY(-32px); } } @keyframes table-glow { to { transform:scale(1.25); opacity:.7; } }
.game-topbar { position: relative; }
.topbar-exit { position: absolute; right: 12px; top: 10px; color: #e9d8ff; font-size: 11px; }
.topbar-sound { position: absolute; right: 72px; top: 7px; width: 30px; height: 30px; border-radius: 50%; color: #fff; background: #ffffff18; border: 1px solid #ffffff35; }
.table-players { display: flex; gap: 8px; padding: 10px 14px 6px; overflow-x: auto; }
.table-player { display: inline-flex; align-items: center; gap: 5px; border: 1px solid #ffffff2e; border-radius: 999px; padding: 6px 9px; color: #f1e8ff; font-size: 12px; white-space: nowrap; background: #251847a8; backdrop-filter: blur(8px); }
.table-player--turn { border-color: #67f3ff; color: #fff; box-shadow: 0 0 16px #45e6ff80; }
.table-player--bot { color: #ffc5eb; }
.table-avatar { font-size: 16px; }.table-ready { color: #6dffad; font-size: 9px; }
.bot-cue { margin: 0 14px 4px; color: #fff0a8; font-size: 12px; min-height: 18px; text-shadow: 0 0 12px #ffcf4c; }

/* ── Top bar ── */
.game-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(180deg, #451564dd, #24124aaa);
  border-bottom: 1px solid #ffffff20;
}

.topbar-round {
  color: #fff3a8;
  font-size: 15px;
  font-weight: 700;
}

.topbar-players {
  color: #d8c8ff;
  font-size: 12px;
}

/* ── Wait bar ── */
.wait-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 16px;
  background: linear-gradient(180deg, #351557e8, #20103ee8);
  border-top: 1px solid #ffffff20;
}

.wait-icon {
  font-size: 20px;
}

.wait-text {
  color: #f1e8ff;
  font-size: 13px;
}

.wait-dots {
  display: flex;
  gap: 4px;
}

.wait-dots .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #72e9ff;
  animation: dot-pulse 1.2s ease-in-out infinite;
}

.wait-dots .dot:nth-child(2) { animation-delay: 0.2s; }
.wait-dots .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-pulse {
  0%, 60%, 100% { opacity: 0.2; transform: scale(0.8); }
  30% { opacity: 1; transform: scale(1.2); }
}

/* ── Eye FAB ── */
.eye-fab {
  position: fixed;
  z-index: 45;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6d2d91, #1d235d);
  border: 1.5px solid #ffffff60;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 12px #00000060, 0 0 18px #63eaff80;
}

/* ── Roll button: Chinese gaming table style ── */
.game-roll-btn {
  position: relative;
  width: 100%;
  padding: 0;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  /* Outer glow — warm gold ambient */
  background: linear-gradient(135deg, #ff4ca1, #7857ff 56%, #26d7e8);
  box-shadow:
    0 1px 0 0 #ffffff80 inset,
    0 6px 20px #1d0a4f99,
    0 0 40px #ff4ca180;
  transition: transform 120ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 120ms;
  overflow: hidden;
}

.roll-btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  border-radius: 14px;
  /* Rich layered gradient — dark red wood with warm highlights */
  background: linear-gradient(135deg, #ff70b7, #906dff 55%, #44e4ef);
  /* Top bevel highlight */
  border-top: 1px solid #ffffff80;
  border-bottom: 1px solid #22125b80;
}

.roll-btn-icon {
  font-size: 26px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.game-roll-btn:active .roll-btn-icon {
  transform: rotate(20deg) scale(1.1);
}

.roll-btn-text {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #fff;
  text-shadow:
    0 1px 2px rgba(0,0,0,0.4),
    0 0 12px oklch(72% 0.14 75 / 0.2);
}

.game-roll-btn:active {
  transform: scale(0.97) translateY(1px);
  box-shadow:
    0 1px 0 0 oklch(72% 0.14 75 / 0.1) inset,
    0 2px 8px oklch(20% 0.1 30 / 0.4),
    0 0 20px oklch(48% 0.2 25 / 0.1);
}

/* Subtle shine sweep on idle */
.game-roll-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    oklch(90% 0.05 75 / 0.08) 50%,
    transparent 100%
  );
  animation: btn-shine 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes btn-shine {
  0%, 70%, 100% { left: -100%; }
  85% { left: 140%; }
}

/* ── Next round button: gold accent ── */
.game-next-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 14px 24px;
  border-radius: 14px;
  background:
    radial-gradient(ellipse 80% 50% at 50% 0%, oklch(80% 0.1 75 / 0.3) 0%, transparent 60%),
    linear-gradient(180deg,
      oklch(72% 0.13 75) 0%,
      oklch(62% 0.14 72) 100%
    );
  border: none;
  border-top: 1px solid oklch(85% 0.08 75 / 0.4);
  color: oklch(15% 0.04 60);
  font-weight: bold;
  cursor: pointer;
  box-shadow:
    0 4px 16px oklch(65% 0.12 75 / 0.3),
    0 0 30px oklch(72% 0.14 75 / 0.1);
  transition: transform 120ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 120ms;
  -webkit-tap-highlight-color: transparent;
}
.game-next-btn:active {
  transform: scale(0.97) translateY(1px);
  box-shadow:
    0 2px 8px oklch(65% 0.12 75 / 0.2),
    0 0 15px oklch(72% 0.14 75 / 0.05);
}
</style>
