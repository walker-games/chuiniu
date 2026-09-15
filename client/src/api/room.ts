import { i18n } from '@/i18n'

const BASE = import.meta.env.VITE_API_BASE ?? ''

async function authFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token') ?? ''
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    if (body.code) {
      const localized = i18n.global.t(body.code, body.params ?? {})
      throw new Error(localized)
    }
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export function createRoom(name?: string, vsBot = false) {
	return authFetch('/api/v1/rooms', {
		method: 'POST',
		body: JSON.stringify({ name: name || '', vs_bot: vsBot }),
	})
}

export function listPublicRooms(): Promise<{ rooms: Array<{ id: string; code: string; title: string; player_count: number; max_players: number }> }> {
	return authFetch('/public/rooms')
}

export function joinRoom(code: string, name?: string) {
  return authFetch('/api/v1/rooms/join', {
    method: 'POST',
    body: JSON.stringify({ code, name: name || '' }),
  })
}

export function getRoom(roomId: string) {
  return authFetch(`/api/v1/rooms/${roomId}`)
}
