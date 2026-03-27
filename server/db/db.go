package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func Init() {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_USER", "postgres"),
		getEnv("DB_PASSWORD", "postgres"),
		getEnv("DB_NAME", "wombocombo"),
	)

	var err error
	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("[DB] Failed to connect:", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatal("[DB] Failed to ping:", err)
	}

	migrate()
	log.Println("[DB] Connected and migrated")
}

func migrate() {
	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id            SERIAL PRIMARY KEY,
		username      VARCHAR(32)  UNIQUE NOT NULL,
		email         VARCHAR(255) UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		display_name  VARCHAR(64),
		created_at    TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS rooms (
		id          SERIAL PRIMARY KEY,
		code        VARCHAR(8) UNIQUE NOT NULL,
		host_id     INT REFERENCES users(id),
		name        VARCHAR(64) NOT NULL,
		max_players INT DEFAULT 2,
		is_public   BOOLEAN DEFAULT true,
		status      VARCHAR(16) DEFAULT 'waiting',
		created_at  TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS room_players (
		room_id    INT REFERENCES rooms(id) ON DELETE CASCADE,
		user_id    INT REFERENCES users(id),
		joined_at  TIMESTAMPTZ DEFAULT NOW(),
		PRIMARY KEY (room_id, user_id)
	);
	`
	if _, err := DB.Exec(schema); err != nil {
		log.Fatal("[DB] Migration failed:", err)
	}
}
