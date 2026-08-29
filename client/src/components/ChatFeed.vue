<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ChatMessage } from '@/types/game'

const { t } = useI18n()

const props = defineProps<{
  messages: ChatMessage[]
}>()

const feedEl = ref<HTMLElement | null>(null)

watch(
  () => props.messages.length,
  async () => {
    await nextTick()
    if (feedEl.value) {
      feedEl.value.scrollTop = feedEl.value.scrollHeight
    }
  },
)
</script>

<template>
  <div ref="feedEl" class="feed-root">
    <div
      v-for="(msg, idx) in messages"
      :key="msg.id"
      class="animate-slide-in"
      :style="{ animationDelay: `${Math.min(idx, 5) * 50}ms` }"
    >
      <!-- system message -->
      <div v-if="msg.type === 'system'" class="msg-system">
        {{ msg.text }}
      </div>

      <!-- roll message -->
      <div v-else-if="msg.type === 'roll'" class="msg-roll">
        <span class="msg-name">{{ msg.playerName }}</span>
        <span class="msg-dim">{{ t('game.rolledTag') }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6a9a40" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>

      <!-- bid message -->
      <div v-else-if="msg.type === 'bid'" class="msg-bid">
        <span class="msg-name">{{ msg.playerName }}</span>
        <span class="msg-bid-value font-serif-cn">{{ msg.text }}</span>
      </div>

      <!-- challenge message -->
      <div v-else-if="msg.type === 'challenge'" class="msg-challenge font-serif-cn">
        {{ msg.playerName }}: {{ t('game.challengeButton') }}
      </div>

      <!-- result message -->
      <div v-else-if="msg.type === 'result'" class="msg-result">
        <template v-for="(line, i) in msg.text.split('\n')" :key="i">
          <!-- NOTE: These substring checks match Chinese text only. Under other locales
               the win/punish/bid specific styling won't apply, but the message still
               renders via the fallback <p>. Ideally ChatMessage should carry a subtype
               field — leaving for a future refactor. -->
          <p v-if="line.includes('贏')" class="result-win font-serif-cn">{{ line }}</p>
          <p v-else-if="line.includes('懲罰')" class="result-punish font-serif-cn">{{ line }}</p>
          <p v-else-if="line.includes('叫點')" class="result-bid">{{ line }}</p>
          <p v-else class="result-text">{{ line }}</p>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feed-root {
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  scroll-behavior: smooth;
}

.feed-root::-webkit-scrollbar { display: none; }
.feed-root { scrollbar-width: none; }

/* ── System ── */
.msg-system {
  text-align: center;
  font-size: 11px;
  color: #6a5a38;
  padding: 4px 0;
}

/* ── Roll ── */
.msg-roll {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
}

/* ── Bid ── */
.msg-bid {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 8px;
  background: #d4a85308;
  border-left: 2px solid #d4a85340;
}

.msg-bid-value {
  color: #f0d080;
  font-size: 17px;
  font-weight: 700;
}

/* ── Challenge ── */
.msg-challenge {
  font-size: 18px;
  font-weight: 700;
  color: #e04030;
  padding: 6px 0;
  text-shadow: 0 0 8px #e0403030;
}

/* ── Result card ── */
.msg-result {
  margin: 6px 0;
  padding: 10px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2a2010, #1e1808);
  border: 1px solid #d4a85315;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.result-win { color: #f0d080; font-weight: 700; font-size: 14px; }
.result-punish { color: #e06050; font-size: 13px; }
.result-bid { color: #d4a85390; font-size: 13px; }
.result-text { color: #a09070; font-size: 13px; line-height: 1.5; }

/* ── Shared ── */
.msg-name {
  color: #c0a060;
  font-size: 13px;
  font-weight: 700;
}

.msg-dim {
  color: #6a5a38;
  font-size: 12px;
}
</style>
