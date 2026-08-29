<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, type Locale, SUPPORTED_LOCALES } from '@/i18n'

const { t, locale } = useI18n()

const open = ref(false)
const rootEl = ref<HTMLDivElement | null>(null)

const current = computed(() => locale.value as Locale)

const labelMap: Record<Locale, string> = {
  'zh-Hant': '繁體中文',
  'zh-Hans': '简体中文',
  'en': 'English',
  'th': 'ไทย',
}

function toggle() {
  open.value = !open.value
}

function pick(loc: Locale) {
  setLocale(loc)
  open.value = false
}

function onDocClick(e: MouseEvent) {
  if (!open.value) return
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="rootEl" class="lang-switcher-wrap">
    <button class="lang-switcher" :aria-label="t('langSwitcher.title')" @click.stop="toggle">
      <span class="lang-icon">🌐</span>
    </button>
    <Transition name="lang-pop">
      <div v-if="open" class="lang-popup" role="menu">
        <button
          v-for="loc in SUPPORTED_LOCALES"
          :key="loc"
          class="lang-item"
          :class="{ 'lang-item--active': loc === current }"
          role="menuitem"
          @click="pick(loc)"
        >
          {{ labelMap[loc] }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.lang-switcher-wrap {
  position: relative;
  display: inline-flex;
}

.lang-switcher {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid oklch(72% 0.14 75 / 0.2);
  background: oklch(16% 0.03 55 / 0.6);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 120ms, border-color 120ms;
}
.lang-switcher:active {
  transform: scale(0.92);
  border-color: oklch(72% 0.14 75 / 0.5);
}
.lang-icon {
  font-size: 16px;
  line-height: 1;
}

.lang-popup {
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);
  min-width: 140px;
  padding: 6px;
  border-radius: 12px;
  background: oklch(14% 0.02 55 / 0.96);
  border: 1px solid oklch(72% 0.14 75 / 0.22);
  box-shadow: 0 12px 32px oklch(0% 0 0 / 0.5);
  backdrop-filter: blur(12px);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lang-item {
  display: block;
  width: 100%;
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: oklch(82% 0.02 75);
  font-size: 14px;
  text-align: right;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 120ms, color 120ms;
}
.lang-item:hover,
.lang-item:active {
  background: oklch(22% 0.04 60);
}
.lang-item--active {
  color: #c49a38;
  font-weight: 600;
}

.lang-pop-enter-active,
.lang-pop-leave-active {
  transition: opacity 160ms, transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
}
.lang-pop-enter-from,
.lang-pop-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.96);
  transform-origin: bottom right;
}
</style>
