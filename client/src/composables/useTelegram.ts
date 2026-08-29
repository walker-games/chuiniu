import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const tg = window.Telegram?.WebApp

export function useTelegram() {
  const router = useRouter()
  const inTelegram = computed(() => !!tg)
  const platform = computed(() => tg?.platform ?? 'unknown')
  const viewportHeight = ref(tg?.viewportHeight ?? window.innerHeight)

  const initData = computed(() => tg?.initData ?? '')
  const tgUser = computed(() => tg?.initDataUnsafe?.user ?? null)
  const startParam = computed(() => tg?.initDataUnsafe?.start_param ?? null)

  function ready() {
    tg?.ready()
    tg?.expand()
  }

  function haptic(style: 'light' | 'medium' | 'heavy' = 'medium') {
    tg?.HapticFeedback?.impactOccurred(style)
  }

  function hapticSuccess() {
    tg?.HapticFeedback?.notificationOccurred('success')
  }

  function hapticError() {
    tg?.HapticFeedback?.notificationOccurred('error')
  }

  function setupBackButton() {
    if (!tg) return
    router.afterEach((to) => {
      if (to.path === '/') {
        tg.BackButton.hide()
      } else {
        tg.BackButton.show()
        tg.BackButton.onClick(() => router.back())
      }
    })
  }

  return {
    tg, inTelegram, platform, viewportHeight,
    initData, tgUser, startParam,
    ready, haptic, hapticSuccess, hapticError, setupBackButton,
  }
}
