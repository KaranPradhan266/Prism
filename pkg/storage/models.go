package storage

import (
	//"database/sql"
	"time"
)

// Project represents a project stored in the database.
type Project struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"` // Can be NULL
	Name        string    `json:"name"`
	PathPrefix  string    `json:"path_prefix"`
	UpstreamURL string    `json:"upstream_url"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Status      string    `json:"status`
}

// Rule represents a firewall rule stored in the database.
type Rule struct {
	ID        string    `json:"id"`
	ProjectID string    `json:"project_id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Value     string    `json:"value"`
	Enabled   bool      `json:"enabled"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
