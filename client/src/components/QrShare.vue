<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from 'vant'

const { t } = useI18n()
import 'vant/es/button/style'
import QRCode from 'qrcode'
import { useTelegram } from '@/composables/useTelegram'

const props = defineProps<{
  inviteCode: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const copied = ref(false)
const { tg } = useTelegram()

const botName = import.meta.env.VITE_TG_BOT_NAME || 'WalkerLearnBot'
const link = ref('')

function updateLink() {
  link.value = `https://t.me/${botName}/chuiniu?startapp=${props.inviteCode}`
}

async function renderQR() {
  updateLink()
  if (!canvasRef.value) return
  await QRCode.toCanvas(canvasRef.value, link.value, {
    width: 180,
    margin: 2,
    color: { dark: '#D4A853', light: '#0F0F1A' },
  })
}

function copyLink() {
  navigator.clipboard.writeText(link.value).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}

function shareToTG() {
  const text = encodeURIComponent(t('common.tgShareText'))
  const url = encodeURIComponent(link.value)
  tg?.openTelegramLink(`https://t.me/share/url?url=${url}&text=${text}`)
}

onMounted(renderQR)
watch(() => props.inviteCode, renderQR)
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <canvas ref="canvasRef" class="rounded-xl" />
    <div class="flex gap-3">
      <Button
        class="share-btn"
        size="small"
        @click="copyLink"
      >
        <span class="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          {{ copied ? t('common.copied') : t('common.copyLink') }}
        </span>
      </Button>
      <Button
        class="share-btn share-btn--primary"
        size="small"
        @click="shareToTG"
      >
        <span class="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          {{ t('common.tgShare') }}
        </span>
      </Button>
    </div>
  </div>
</template>

<style scoped>
.share-btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid rgba(212, 168, 83, 0.3);
  color: #D4A853;
  font-size: 13px;
  cursor: pointer;
  transition: all 200ms ease;
}
.share-btn:active {
  background: rgba(212, 168, 83, 0.1);
}
.share-btn--primary {
  background: rgba(212, 168, 83, 0.12);
  border-color: rgba(212, 168, 83, 0.4);
}
</style>
