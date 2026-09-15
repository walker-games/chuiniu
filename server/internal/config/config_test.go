package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadRedisURLFromEnvironment(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.yaml")
	if err := os.WriteFile(path, []byte("app:\n  name: test\n  port: 1\nredis:\n  url: ''\n  snapshot_ttl: 45m\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("CHUINIU_REDIS_URL", "redis://127.0.0.1:6379/2")
	cfg, err := Load(path)
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Redis.URL != "redis://127.0.0.1:6379/2" {
		t.Fatalf("redis env override not loaded: %q", cfg.Redis.URL)
	}
}
