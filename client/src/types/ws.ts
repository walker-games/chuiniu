export interface WSMessage<T = unknown> {
  type: string
  data: T
  ts: number
}

export interface RoomStateData {
  id: string
  code: string
  host: string
  players: import('./game').Player[]
  status: string
  round?: import('./game').Round
}

export interface RollResultData {
  dice: number[]
}

export interface BidMadeData {
  playerId: string
  count: number
  face: number
  mode: string
}

export interface TurnChangeData {
  playerId: string
}

export interface ChallengeResultData {
  challenger: string
  target: string
  bid: import('./game').Bid
  allDice: Record<string, number[]>
  actualCount: number
  winner: string
  loser: string
}

export interface ErrorData {
  code: string
  params?: Record<string, unknown>
}

export interface PunishmentData {
  loser: string
  punishment_key: string
  punishment_text: string
  level: number
}

export interface RoundEndData {
  scores: Record<string, number>
}

export interface PlayerEmojiData {
  playerId: string
  emoji: string
}
