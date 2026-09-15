<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Bid } from '@/types/game'

const { t } = useI18n()

const CDN = '/images/dice'

const props = defineProps<{
  minCount: number
  maxCount: number
  previousBid: Bid | null
  playerCount: number
}>()

defineEmits<{
  bid: [payload: { count: number; face: number; mode: 'fei' | 'zhai' }]
  challenge: []
}>()

const count = ref(props.previousBid ? props.previousBid.count : 1)
const face = ref(props.previousBid ? Math.min(props.previousBid.face + 1, 6) : 1)
const mode = ref<'fei' | 'zhai'>(props.previousBid?.mode ?? 'fei')

watch(() => props.previousBid, (bid) => {
  if (bid) {
    count.value = bid.count
    face.value = Math.min(bid.face + 1, 6)
    mode.value = bid.mode
    if (face.value > 6) { face.value = 1; count.value = bid.count + 1 }
  }
})

const effectiveMinCount = computed(() => {
  if (!props.previousBid) return 1
  const prev = props.previousBid
  if (prev.mode === 'fei' && mode.value === 'zhai') return Math.ceil(prev.count / 2)
  if (prev.mode === 'zhai' && mode.value === 'fei') return prev.count * 2 + 1
  return prev.count
})

function increment() {
  if (count.value < props.maxCount) count.value++
}

function decrement() {
  if (count.value > effectiveMinCount.value) count.value--
}

function selectFace(f: number) {
  face.value = f
}

function toggleMode() {
  mode.value = mode.value === 'fei' ? 'zhai' : 'fei'
  if (count.value < effectiveMinCount.value) {
    count.value = effectiveMinCount.value
  }
}

function isBidValid() {
  if (!props.previousBid) return true
  const prev = props.previousBid
  if (mode.value === prev.mode) {
    if (count.value > prev.count) return true
    if (count.value === prev.count && face.value > prev.face) return true
    return false
  }
  return count.value >= effectiveMinCount.value
}

const canSubmit = computed(() => isBidValid() && count.value <= props.maxCount)
const modeText = computed(() => mode.value === 'fei' ? t('game.modeFei') : t('game.modeZhai'))
const quickCounts = computed(() => Array.from({ length: Math.min(props.maxCount, 8) }, (_, index) => index + 1))

function selectCount(value: number) {
  if (value >= effectiveMinCount.value && value <= props.maxCount) count.value = value
}
</script>

<template>
  <div class="bid-root">
    <div class="quick-counts" aria-label="quick count selection">
      <button v-for="value in quickCounts" :key="value" class="count-chip" :class="{ 'count-chip--active': count === value }" :disabled="value < effectiveMinCount" @click="selectCount(value)">{{ value }}</button>
    </div>
    <!-- Dice face row -->
    <div class="face-row">
      <button
        v-for="f in 6"
        :key="f"
        class="face-btn"
        :class="{ 'face-btn--active': face === f }"
        @click="selectFace(f)"
      >
        <img :src="`${CDN}/dice-${f}.png`" :alt="`${f}`" class="face-img" />
      </button>
    </div>

    <!-- Count + Mode row -->
    <div class="control-row">
      <div class="count-stepper">
        <button class="st-btn" :disabled="count <= effectiveMinCount" @click="decrement">−</button>
        <span class="count-val font-serif-cn">{{ count }}</span>
        <button class="st-btn" :disabled="count >= maxCount" @click="increment">+</button>
      </div>

      <span class="bid-label font-serif-cn">{{ t('game.countUnit') }}</span>

      <div class="face-preview">
        <img :src="`${CDN}/dice-${face}.png`" class="preview-img" />
      </div>

      <button
        class="mode-btn font-serif-cn"
        :class="mode === 'zhai' ? 'mode-btn--zhai' : ''"
        @click="toggleMode"
      >
        {{ modeText }}
      </button>
    </div>

    <!-- Action buttons -->
    <div class="bid-actions">
      <button
        class="btn-bid"
        :disabled="!canSubmit"
        @click="$emit('bid', { count, face, mode })"
      >
        <span class="font-serif-cn">{{ t('game.confirmBidPrefix') }} {{ t('result.bidDisplayTemplate', { count, face, mode: modeText }) }}</span>
      </button>
      <button
        v-if="previousBid"
        class="btn-challenge"
        @click="$emit('challenge')"
      >
        {{ t('game.challengeButton') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.bid-root {
  padding: 10px 14px 14px;
  background: linear-gradient(180deg, #35135ddb, #1b1243f5);
  border-top: 1px solid #ffffff2e;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.quick-counts { display:flex; gap:6px; overflow-x:auto; padding:1px 2px; justify-content:center; }
.count-chip { min-width:32px; height:32px; border-radius:999px; border:1px solid #ffffff45; color:#f6eeff; background:#ffffff16; font-weight:700; cursor:pointer; }
.count-chip--active { color:#211045; background:#6ff2ff; border-color:#fff; box-shadow:0 0 14px #6ff2ff90; }.count-chip:disabled { opacity:.25; }

/* ── Dice face row ── */
.face-row {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.face-btn {
  width: 46px;
  height: 46px;
  padding: 4px;
  border-radius: 10px;
  border: 2px solid transparent;
  background: #ffffff15;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 120ms cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.face-btn--active {
  border-color: #6ff2ff;
  background: #6ff2ff22;
  transform: scale(1.12);
  box-shadow: 0 0 14px #6ff2ff75;
}

.face-img {
  width: 34px;
  height: 34px;
  border-radius: 5px;
  pointer-events: none;
}

/* ── Count + Mode row ── */
.control-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.count-stepper {
  display: flex;
  align-items: center;
  border-radius: 10px;
  background: #ffffff10;
  border: 1px solid #ffffff36;
  overflow: hidden;
}

.st-btn {
  width: 38px;
  height: 38px;
  background: none;
  border: none;
  color: #7af4ff;
  font-size: 22px;
  font-weight: 700;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.st-btn:active { background: #d4a85312; }
.st-btn:disabled { color: #3a3020; cursor: not-allowed; }

.count-val {
  width: 36px;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.bid-label {
  color: #d8c8ff;
  font-size: 15px;
}

.face-preview {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #ffffff15;
  border: 1px solid #ffffff40;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-img {
  width: 28px;
  height: 28px;
  border-radius: 4px;
}

.mode-btn {
  padding: 7px 16px;
  border-radius: 8px;
  border: 1px solid #ffffff52;
  background: #ffffff16;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 100ms;
}

.mode-btn:active { transform: scale(0.95); }

.mode-btn--zhai {
  border-color: #c0302050;
  background: linear-gradient(180deg, #3a1810, #2a1008);
  color: #e08060;
}

/* ── Action buttons ── */
.bid-actions {
  display: flex;
  gap: 8px;
}

.btn-bid {
  flex: 1;
  height: 46px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  background: linear-gradient(135deg, #62edf4, #b17aff 55%, #ff69b4);
  color: #201044;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 1px 0 #f0d880 inset, 0 -1px 0 #886818 inset, 0 3px 10px #c49a3840;
  transition: transform 100ms cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-bid:active { transform: scale(0.97) translateY(1px); }
.btn-bid:disabled { opacity: 0.3; cursor: not-allowed; }

.btn-challenge {
  padding: 0 22px;
  height: 46px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  background: linear-gradient(180deg, #d03828, #a01810, #801008);
  color: #f0d080;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 1px 0 #e8483890 inset, 0 -1px 0 #60100890 inset, 0 3px 10px #80100840;
  transition: transform 100ms cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-challenge:active { transform: scale(0.97) translateY(1px); }
</style>
