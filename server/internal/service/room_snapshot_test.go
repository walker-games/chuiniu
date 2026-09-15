package service

import (
	"os"
	"testing"
	"time"

	"github.com/walker-games/chuiniu-server/internal/game"
)

func TestRoomSnapshotRoundTrip(t *testing.T) {
	url := os.Getenv("REDIS_URL")
	if url == "" {
		t.Skip("REDIS_URL is not configured")
	}
	store, err := NewRoomSnapshotStore(url, "1m")
	if err != nil {
		t.Fatalf("new store: %v", err)
	}
	defer store.Close()

	room := game.NewRoom("snapshot-human", "Human", "")
	room.AddDefaultBot()
	room.StartRound("snapshot-human")
	if err := store.Save(room); err != nil {
		t.Fatalf("save: %v", err)
	}
	restored, err := store.Load(room.ID)
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	if restored.ID != room.ID || len(restored.Players) != 2 || restored.Round == nil {
		t.Fatalf("unexpected restored room: %#v", restored)
	}
}

func TestRoomManagerRestoresSnapshotByIDAndCode(t *testing.T) {
	url := os.Getenv("REDIS_URL")
	if url == "" {
		t.Skip("REDIS_URL is not configured")
	}
	store, err := NewRoomSnapshotStore(url, "1m")
	if err != nil {
		t.Fatalf("new store: %v", err)
	}
	defer store.Close()

	originalManager := game.NewRoomManager(time.Hour)
	original := originalManager.CreateBotRoom("restore-human", "Human", "")
	original.StartRound("restore-human")
	if err := store.Save(original); err != nil {
		t.Fatalf("save: %v", err)
	}

	restartedManager := game.NewRoomManager(time.Hour)
	restartedManager.SetSnapshotRepository(store)
	byID := restartedManager.GetRoom(original.ID)
	if byID == nil || byID.Round == nil {
		t.Fatal("room was not restored by id")
	}
	if human := byID.GetPlayer("restore-human"); human == nil || human.Connected {
		t.Fatal("restored human must await websocket reconnect")
	}
	if bot := byID.GetPlayer(game.DefaultBotID); bot == nil || !bot.Connected {
		t.Fatal("restored bot should remain available")
	}

	// A fresh manager proves that the invitation-code Redis index restores too.
	byCodeManager := game.NewRoomManager(time.Hour)
	byCodeManager.SetSnapshotRepository(store)
	if byCode := byCodeManager.GetRoomByCode(original.Code); byCode == nil || byCode.ID != original.ID {
		t.Fatal("room was not restored by invite code")
	}
}
