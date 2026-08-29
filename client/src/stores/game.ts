import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Bid } from '@/types/game'
import type { PunishmentData } from '@/types/ws'

export const useGameStore = defineStore('game', () => {
  const myDice = ref<number[]>([])
  const currentBid = ref<Bid | null>(null)
  const currentTurn = ref('')
  const phase = ref<'rolling' | 'bidding' | 'challenging' | 'settling'>('rolling')
  const bidHistory = ref<Bid[]>([])

  const challengeResult = ref<{
    challenger: string
    target: string
    bid: Bid
    allDice: Record<string, number[]>
    actualCount: number
    winner: string
    loser: string
  } | null>(null)

  const punishment = ref<PunishmentData | null>(null)

  function setDice(dice: number[]) { myDice.value = dice }
  function setBid(bid: Bid) { currentBid.value = bid; bidHistory.value.push(bid) }
  function setTurn(playerId: string) { currentTurn.value = playerId }
  function setPhase(p: typeof phase.value) { phase.value = p }

  function reset() {
    myDice.value = []
    currentBid.value = null
    currentTurn.value = ''
    phase.value = 'rolling'
    bidHistory.value = []
    challengeResult.value = null
    punishment.value = null
  }

  return {
    myDice, currentBid, currentTurn, phase, bidHistory,
    challengeResult, punishment,
    setDice, setBid, setTurn, setPhase, reset,
  }
})
