package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	App      AppConfig      `mapstructure:"app"`
	Database DatabaseConfig `mapstructure:"database"`
	IAM      IAMConfig      `mapstructure:"iam"`
	Room     RoomConfig     `mapstructure:"room"`
	Redis    RedisConfig    `mapstructure:"redis"`
}

type AppConfig struct {
	Name string `mapstructure:"name"`
	Port int    `mapstructure:"port"`
	Env  string `mapstructure:"env"`
}

type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	DBName   string `mapstructure:"dbname"`
	Charset  string `mapstructure:"charset"`
}

type IAMConfig struct {
	JWKSURL string `mapstructure:"jwks_url"`
}

type RoomConfig struct {
	MaxPlayers       int    `mapstructure:"max_players"`
	DicePerPlayer    int    `mapstructure:"dice_per_player"`
	IdleTimeout      string `mapstructure:"idle_timeout"`
	ReconnectTimeout string `mapstructure:"reconnect_timeout"`
}

type RedisConfig struct {
	URL         string `mapstructure:"url"`
	SnapshotTTL string `mapstructure:"snapshot_ttl"`
}

func (d DatabaseConfig) DSN() string {
	charset := d.Charset
	if charset == "" {
		charset = "utf8mb4"
	}
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=True&loc=Local",
		d.User, d.Password, d.Host, d.Port, d.DBName, charset)
}

func Load(path string) (*Config, error) {
	v := viper.New()
	v.SetConfigFile(path)
	v.SetEnvPrefix("CHUINIU")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()
	// Nested keys are explicitly bound so a deployment setting such as
	// CHUINIU_REDIS_URL cannot be silently ignored by viper.Unmarshal.
	_ = v.BindEnv("redis.url")
	_ = v.BindEnv("redis.snapshot_ttl")

	if err := v.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("read config: %w", err)
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("unmarshal config: %w", err)
	}
	return &cfg, nil
}
