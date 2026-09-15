package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/walker-games/chuiniu-server/internal/game"
)

// RoomSnapshotStore is a recovery aid, not a second rule engine. The Go room
// remains authoritative while the process is alive; every broadcast persists a
// bounded-TTL snapshot that can later be used for reconnect/recovery work.
type RoomSnapshotStore struct {
	client *redis.Client
	ttl    time.Duration
}

func NewRoomSnapshotStore(rawURL, rawTTL string) (*RoomSnapshotStore, error) {
	if rawURL == "" {
		return nil, nil
	}
	options, err := redis.ParseURL(rawURL)
	if err != nil {
		return nil, fmt.Errorf("parse redis url: %w", err)
	}
	ttl, err := time.ParseDuration(rawTTL)
	if err != nil || ttl <= 0 {
		ttl = 45 * time.Minute
	}
	store := &RoomSnapshotStore{client: redis.NewClient(options), ttl: ttl}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := store.client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("ping redis: %w", err)
	}
	return store, nil
}

func (s *RoomSnapshotStore) Save(room *game.Room) error {
	if s == nil {
		return nil
	}
	payload, err := room.Snapshot()
	if err != nil {
		return fmt.Errorf("marshal room snapshot: %w", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	pipe := s.client.TxPipeline()
	pipe.Set(ctx, "chuiniu:room:"+room.ID, payload, s.ttl)
	pipe.Set(ctx, "chuiniu:room-code:"+room.Code, room.ID, s.ttl)
	_, err = pipe.Exec(ctx)
	return err
}

func (s *RoomSnapshotStore) LoadByCode(code string) (*game.Room, error) {
	if s == nil {
		return nil, fmt.Errorf("room snapshot store is disabled")
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	roomID, err := s.client.Get(ctx, "chuiniu:room-code:"+code).Result()
	if err != nil {
		return nil, err
	}
	return s.Load(roomID)
}

func (s *RoomSnapshotStore) Load(roomID string) (*game.Room, error) {
	if s == nil {
		return nil, fmt.Errorf("room snapshot store is disabled")
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	payload, err := s.client.Get(ctx, "chuiniu:room:"+roomID).Bytes()
	if err != nil {
		return nil, err
	}
	var room game.Room
	if err := json.Unmarshal(payload, &room); err != nil {
		return nil, fmt.Errorf("unmarshal room snapshot: %w", err)
	}
	return &room, nil
}

func (s *RoomSnapshotStore) Close() error {
	if s == nil {
		return nil
	}
	return s.client.Close()
}
