<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTelegram } from '@/composables/useTelegram'
import { useAuthStore } from '@/stores/auth'
import { createRoom } from '@/api/room'
import LangSwitcher from '@/components/LangSwitcher.vue'

const { t } = useI18n()
const router = useRouter()
const { ready, inTelegram, startParam, tg } = useTelegram()
const authStore = useAuthStore()

const inviteCode = ref('')
const error = ref('')
const loading = ref(false)

async function autoLogin() {
  if (authStore.isLoggedIn) return

  const urlParams = new URLSearchParams(window.location.search)
  const parentToken = urlParams.get('token')
  const parentUser = urlParams.get('user')
  if (parentToken) {
    authStore.token = parentToken
    authStore.user = { id: parentToken.replace('dev-', ''), name: parentUser || t('home.defaultPlayerName'), avatar: '' }
    localStorage.setItem('token', parentToken)
    return
  }

  if (inTelegram.value) {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
    const userId = tgUser?.id?.toString() || `tg-${Date.now()}`
    const name = tgUser?.first_name || `${t('home.defaultPlayerName')}${Math.floor(Math.random() * 1000)}`
    authStore.devLogin(userId, name)
    return
  }

  const devId = `dev-${Date.now()}`
  authStore.devLogin(devId, `${t('home.defaultPlayerName')}${Math.floor(Math.random() * 1000)}`)
}

async function handleCreate() {
  error.value = ''
  loading.value = true
  try {
    const res = await createRoom(authStore.user?.name)
    router.push(`/lobby/${res.room_id}`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t('home.errorCreate')
  } finally {
    loading.value = false
  }
}

async function handleJoin(code: string) {
  error.value = ''
  loading.value = true
  try {
    const { joinRoom } = await import('@/api/room')
    const res = await joinRoom(code, authStore.user?.name)
    router.push(`/lobby/${res.room_id}`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t('home.errorJoin')
  } finally {
    loading.value = false
  }
}

function openJobContact() {
  const url = 'https://t.me/petterZZ'
  if (tg?.openTelegramLink) tg.openTelegramLink(url)
  else window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(async () => {
  ready()
  await autoLogin()

  const urlCode = new URLSearchParams(window.location.search).get('code')
  const joinCode = startParam.value || urlCode
  if (joinCode) {
    await handleJoin(joinCode)
  }
})
</script>

<template>
  <div class="home-root">
    <!-- Background -->
    <div class="home-bg" />

    <!-- Content -->
    <div class="home-content">
      <!-- Hero: dice emoji cluster -->
      <div class="hero-dice animate-fade-up">
        <span class="dice-main">🎲</span>
        <span class="dice-side dice-l">🎲</span>
        <span class="dice-side dice-r">🎲</span>
      </div>

      <!-- Title -->
      <h1 class="home-title font-serif-cn animate-fade-up stagger-1">
        {{ t('home.title') }}
      </h1>
      <p class="home-subtitle font-serif-cn animate-fade-up stagger-2">
        {{ t('home.subtitle') }}
      </p>

      <!-- Error -->
      <div v-if="error" class="home-error animate-fade-up">
        {{ error }}
      </div>

      <!-- Create room -->
      <button
        class="home-btn-create animate-fade-up stagger-3"
        :disabled="loading"
        @click="handleCreate"
      >
        <span class="font-serif-cn text-2xl tracking-[0.3em]">{{ t('home.createRoom') }}</span>
      </button>

      <!-- Join room (compact) -->
      <div class="home-join-row animate-fade-up stagger-4">
        <input
          v-model="inviteCode"
          type="text"
          :placeholder="t('home.roomCodePlaceholder')"
          class="home-input-mini"
          @keyup.enter="handleJoin(inviteCode.trim())"
        />
        <button
          class="home-btn-join-mini"
          :disabled="loading || !inviteCode.trim()"
          @click="handleJoin(inviteCode.trim())"
        >
          <span class="font-serif-cn">{{ t('home.joinRoom') }}</span>
        </button>
      </div>

      <!-- Footer row: history + lang switcher -->
      <div class="home-footer animate-fade-up" style="animation-delay: 250ms">
        <button
          class="home-history"
          @click="router.push('/history')"
        >
          {{ t('home.history') }}
        </button>
        <LangSwitcher />
      </div>
      <button class="developer-contact animate-fade-up" type="button" style="animation-delay: 320ms" @click="openJobContact">
        <span class="developer-contact-copy"><small>{{ t('home.creatorLabel') }}</small><strong>{{ t('home.remoteWork') }}</strong></span>
        <span class="developer-contact-tg"><small>{{ t('home.jobContact') }}</small><b>@petterZZ</b></span>
        <span class="developer-contact-arrow" aria-hidden="true">↗</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.home-root {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
}

/* ── Background: warm radial glow, pure CSS (no decorative rule lines) ── */
.home-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 38%, oklch(28% 0.06 60 / 0.9) 0%, transparent 70%),
    radial-gradient(ellipse at 50% 100%, oklch(20% 0.05 55) 0%, oklch(10% 0.02 55) 100%);
}

.home-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, oklch(85% 0.12 80 / 0.06) 0, transparent 40%),
    radial-gradient(circle at 80% 70%, oklch(85% 0.12 80 / 0.04) 0, transparent 35%);
  pointer-events: none;
}

/* ── Footer actions row (history link + lang switcher) ── */
.home-footer {
  margin-top: 28px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.developer-contact {
  width: min(340px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 18px;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  padding: 12px 14px;
  border: 1px solid oklch(72% 0.12 75 / 0.42);
  border-radius: 12px;
  background: oklch(17% 0.035 55 / 0.88);
  color: oklch(91% 0.05 80);
  text-align: left;
  box-shadow: 0 12px 30px oklch(5% 0.02 55 / 0.32);
  transition: transform 180ms cubic-bezier(.22, 1, .36, 1), border-color 180ms ease;
}

.developer-contact:active { transform: translateY(1px); border-color: oklch(82% 0.14 80 / 0.72); }
.developer-contact-copy, .developer-contact-tg { display: grid; gap: 3px; }
.developer-contact-copy small, .developer-contact-tg small { color: oklch(72% 0.045 75); font-size: 9px; line-height: 1.2; }
.developer-contact-copy strong { color: oklch(92% 0.07 82); font-size: 13px; white-space: nowrap; }
.developer-contact-tg { justify-items: end; }
.developer-contact-tg b { color: oklch(82% 0.14 80); font-size: 12px; }
.developer-contact-arrow { color: oklch(82% 0.14 80); font-size: 17px; }

/* ── Content ── */
.home-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 40px 24px;
  gap: 0;
}

/* ── Hero dice ── */
.hero-dice {
  position: relative;
  margin-bottom: 20px;
  height: 80px;
  width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dice-main {
  font-size: 56px;
  filter: drop-shadow(0 4px 12px oklch(72% 0.14 75 / 0.3));
  animation: dice-float 3s ease-in-out infinite;
}

.dice-side {
  position: absolute;
  font-size: 32px;
  opacity: 0.5;
  filter: drop-shadow(0 2px 8px oklch(72% 0.14 75 / 0.2));
}

.dice-l {
  left: 8px;
  top: 8px;
  transform: rotate(-15deg);
  animation: dice-float 3s ease-in-out infinite 0.5s;
}

.dice-r {
  right: 8px;
  bottom: 4px;
  transform: rotate(12deg);
  animation: dice-float 3s ease-in-out infinite 1s;
}

@keyframes dice-float {
  0%, 100% { transform: translateY(0) rotate(var(--rot, 0deg)); }
  50% { transform: translateY(-6px) rotate(var(--rot, 0deg)); }
}

.dice-l { --rot: -15deg; }
.dice-r { --rot: 12deg; }

/* ── Title ── */
.home-title {
  font-size: clamp(2.5rem, 10vw, 3.5rem);
  font-weight: 700;
  background: linear-gradient(180deg, #f0d080 0%, #c49a38 50%, #a07a20 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
  margin-bottom: 6px;
  line-height: 1.2;
}

.home-subtitle {
  font-size: 14px;
  letter-spacing: 0.35em;
  color: #8a7442;
  margin-bottom: 36px;
}

/* ── Error ── */
.home-error {
  margin-bottom: 16px;
  padding: 10px 20px;
  border-radius: 12px;
  background: oklch(20% 0.08 25 / 0.6);
  border: 1px solid oklch(48% 0.2 25 / 0.3);
  color: oklch(70% 0.15 25);
  font-size: 14px;
  max-width: 280px;
  width: 100%;
  text-align: center;
}

/* ── Create button (primary CTA) ── */
.home-btn-create {
  position: relative;
  width: 100%;
  max-width: 280px;
  padding: 16px 24px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;

  background: linear-gradient(180deg, #e8c050 0%, #c49a38 50%, #a07a20 100%);
  color: #1a1208;
  font-weight: 700;
  box-shadow:
    0 1px 0 #f0d880 inset,
    0 -1px 0 #886818 inset,
    0 6px 24px #c49a3860,
    0 0 40px #c49a3825;
  transition: transform 120ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 120ms;
}

.home-btn-create:active {
  transform: scale(0.97) translateY(1px);
  box-shadow:
    0 1px 0 0 oklch(72% 0.14 75 / 0.08) inset,
    0 2px 10px oklch(20% 0.1 25 / 0.4);
}

.home-btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Shine sweep */
.home-btn-create::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, oklch(90% 0.05 75 / 0.08) 50%, transparent 100%);
  animation: btn-shine 3.5s ease-in-out infinite;
  pointer-events: none;
}

@keyframes btn-shine {
  0%, 65%, 100% { left: -100%; }
  80% { left: 140%; }
}

/* ── Join row (compact inline) ── */
.home-join-row {
  display: flex;
  gap: 8px;
  width: 100%;
  max-width: 280px;
  margin-top: 20px;
}

.home-input-mini {
  flex: 1;
  padding: 10px 14px;
  border-radius: 10px;
  background: oklch(12% 0.02 55 / 0.7);
  border: 1px solid oklch(72% 0.14 75 / 0.1);
  color: oklch(85% 0.03 75);
  font-size: 14px;
  text-align: center;
  letter-spacing: 0.05em;
  outline: none;
  transition: border-color 200ms;
  -webkit-tap-highlight-color: transparent;
}

.home-input-mini::placeholder {
  color: oklch(38% 0.02 60);
}

.home-input-mini:focus {
  border-color: oklch(72% 0.14 75 / 0.3);
}

.home-btn-join-mini {
  padding: 10px 18px;
  border-radius: 10px;
  background: oklch(16% 0.03 55);
  border: 1px solid oklch(72% 0.14 75 / 0.18);
  color: oklch(72% 0.14 75);
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 100ms cubic-bezier(0.16, 1, 0.3, 1), opacity 100ms;
  -webkit-tap-highlight-color: transparent;
}

.home-btn-join-mini:active {
  transform: scale(0.96);
}

.home-btn-join-mini:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

/* ── History link ── */
.home-history {
  background: none;
  border: none;
  color: oklch(45% 0.03 60);
  font-size: 13px;
  text-decoration: underline;
  text-underline-offset: 4px;
  cursor: pointer;
  transition: color 200ms;
  -webkit-tap-highlight-color: transparent;
}

.home-history:active {
  color: oklch(60% 0.05 60);
}
</style>
