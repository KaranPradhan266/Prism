package storage

import (
	"database/sql"
	"fmt"

	// The blank import is required for the Postgres driver to register itself.
	_ "github.com/lib/pq"
)

// NewDB creates and verifies a new database connection.
func NewDB(connStr string) (*sql.DB, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Ping the database to ensure the connection is live.
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}
