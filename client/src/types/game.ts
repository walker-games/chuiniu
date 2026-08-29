export interface Player {
  id: string
  name: string
  avatar: string
  dice?: number[]
  ready: boolean
  connected: boolean
  score: number
  rolled: boolean
}

export interface Bid {
  player_id: string
  count: number
  face: number
  mode: 'zhai' | 'fei'
}

export interface Round {
  number: number
  phase: 'rolling' | 'bidding' | 'challenging' | 'settling'
  turn_order: string[]
  turn_index: number
  current_bid: Bid | null
}

export interface Room {
  id: string
  code: string
  host: string
  players: Player[]
  status: 'waiting' | 'playing' | 'settling'
  round?: Round
}

export interface Punishment {
  text: string
  level: number
  weight: number
}

export interface RoomSettings {
  max_players: number
  dice_per_player: number
  punishments: Punishment[]
}

export interface ChatMessage {
  id: string
  type: 'system' | 'bid' | 'challenge' | 'result' | 'roll'
  playerId?: string
  playerName?: string
  text: string
  timestamp: number
}
