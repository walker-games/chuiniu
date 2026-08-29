import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const token = ref('')
    const user = ref<{ id: string; name: string; avatar: string } | null>(null)
    const isLoggedIn = computed(() => !!token.value)

    async function loginWithTelegram(initData: string) {
      const res = await fetch('/api/v1/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ init_data: initData }),
      })
      const data = await res.json()
      token.value = data.token
      user.value = data.user
      localStorage.setItem('token', data.token)
    }

    function devLogin(userId: string, name: string) {
      token.value = `dev-${userId}`
      user.value = { id: userId, name, avatar: '' }
      localStorage.setItem('token', token.value)
    }

    function logout() {
      token.value = ''
      user.value = null
      localStorage.removeItem('token')
    }

    return { token, user, isLoggedIn, loginWithTelegram, devLogin, logout }
  },
  { persist: true },
)
