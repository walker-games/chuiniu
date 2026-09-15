package game

import (
	"sync"
	"time"
)

type RoomManager struct {
	rooms       map[string]*Room  // room ID → Room
	codeToRoom  map[string]string // invite code → room ID
	mu          sync.RWMutex
	idleTimeout time.Duration
	snapshots   RoomSnapshotRepository
}

type RoomSnapshotRepository interface {
	Load(roomID string) (*Room, error)
	LoadByCode(code string) (*Room, error)
}

func NewRoomManager(idleTimeout time.Duration) *RoomManager {
	m := &RoomManager{
		rooms:       make(map[string]*Room),
		codeToRoom:  make(map[string]string),
		idleTimeout: idleTimeout,
	}
	m.CreatePresetBotRoom("阿狐练习桌", "bot-fox", "阿狐")
	m.CreatePresetBotRoom("阿豹练习桌", "bot-panther", "阿豹")
	m.CreatePresetBotRoom("阿鲨练习桌", "bot-shark", "阿鲨")
	go m.cleanupLoop()
	return m
}

func (m *RoomManager) CreateRoom(hostID, hostName, hostAvatar string) *Room {
	m.mu.Lock()
	defer m.mu.Unlock()

	room := NewRoom(hostID, hostName, hostAvatar)

	// Ensure unique room ID
	for {
		if _, exists := m.rooms[room.ID]; !exists {
			break
		}
		room.ID = generateRoomID()
	}

	// Ensure unique invite code
	for {
		if _, exists := m.codeToRoom[room.Code]; !exists {
			break
		}
		room.Code = generateInviteCode()
	}

	m.rooms[room.ID] = room
	m.codeToRoom[room.Code] = room.ID
	return room
}

func (m *RoomManager) CreatePresetBotRoom(title, botID, botName string) *Room {
	room := m.CreateRoom(botID, botName, botID)
	room.mu.Lock()
	room.Title, room.Public = title, true
	room.Settings.MaxPlayers = 2
	room.Players[0].IsBot, room.Players[0].Ready = true, true
	room.mu.Unlock()
	return room
}

type PublicRoomSummary struct {
	ID          string `json:"id"`
	Code        string `json:"code"`
	Title       string `json:"title"`
	PlayerCount int    `json:"player_count"`
	MaxPlayers  int    `json:"max_players"`
}

func (m *RoomManager) PublicRooms() []PublicRoomSummary {
	m.mu.RLock()
	defer m.mu.RUnlock()
	rooms := make([]PublicRoomSummary, 0)
	for _, room := range m.rooms {
		room.mu.RLock()
		if room.Public && room.Status == StatusWaiting {
			rooms = append(rooms, PublicRoomSummary{room.ID, room.Code, room.Title, len(room.Players), room.Settings.MaxPlayers})
		}
		room.mu.RUnlock()
	}
	return rooms
}

func (m *RoomManager) CreateBotRoom(hostID, hostName, hostAvatar string) *Room {
	room := m.CreateRoom(hostID, hostName, hostAvatar)
	room.AddDefaultBot()
	return room
}

func (m *RoomManager) SetSnapshotRepository(snapshots RoomSnapshotRepository) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.snapshots = snapshots
}

func (m *RoomManager) GetRoom(roomID string) *Room {
	m.mu.RLock()
	room := m.rooms[roomID]
	snapshots := m.snapshots
	m.mu.RUnlock()
	if room != nil || snapshots == nil {
		return room
	}
	restored, err := snapshots.Load(roomID)
	if err != nil || restored == nil {
		return nil
	}
	return m.restore(restored)
}

func (m *RoomManager) GetRoomByCode(code string) *Room {
	m.mu.RLock()
	roomID, ok := m.codeToRoom[code]
	room := m.rooms[roomID]
	snapshots := m.snapshots
	m.mu.RUnlock()
	if ok {
		return room
	}
	if snapshots == nil {
		return nil
	}
	restored, err := snapshots.LoadByCode(code)
	if err != nil || restored == nil {
		return nil
	}
	return m.restore(restored)
}

func (m *RoomManager) restore(room *Room) *Room {
	room.mu.Lock()
	room.LastActive = time.Now()
	for _, player := range room.Players {
		player.Connected = player.IsBot
	}
	room.mu.Unlock()
	m.mu.Lock()
	defer m.mu.Unlock()
	if existing := m.rooms[room.ID]; existing != nil {
		return existing
	}
	m.rooms[room.ID] = room
	m.codeToRoom[room.Code] = room.ID
	return room
}

func (m *RoomManager) RemoveRoom(roomID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if room, ok := m.rooms[roomID]; ok {
		delete(m.codeToRoom, room.Code)
		delete(m.rooms, roomID)
	}
}

func (m *RoomManager) RoomCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()

	return len(m.rooms)
}

func (m *RoomManager) cleanupLoop() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		m.mu.Lock()
		now := time.Now()
		for id, room := range m.rooms {
			room.mu.RLock()
			idle := now.Sub(room.LastActive) > m.idleTimeout
			empty := room.ConnectedCountLocked() == 0
			room.mu.RUnlock()

			if !room.Public && (idle || empty) {
				delete(m.codeToRoom, room.Code)
				delete(m.rooms, id)
			}
		}
		m.mu.Unlock()
	}
}
