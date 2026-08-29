import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Player, Room } from '@/types/game'

export const useRoomStore = defineStore('room', () => {
  const room = ref<Room | null>(null)

  function updateFromState(state: Room) {
    room.value = state
  }

  function addPlayer(player: Player) {
    if (!room.value) return
    const exists = room.value.players.find((p) => p.id === player.id)
    if (!exists) room.value.players.push(player)
  }

  function removePlayer(playerId: string) {
    if (!room.value) return
    room.value.players = room.value.players.filter((p) => p.id !== playerId)
  }

  function reset() { room.value = null }

  return { room, updateFromState, addPlayer, removePlayer, reset }
})
