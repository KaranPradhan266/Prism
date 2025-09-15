package storage

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	// The blank import is required for the Postgres driver to register itself.
	_ "github.com/lib/pq"
)

// Repository provides methods for interacting with the database.
type Repository struct {
	db *sql.DB
}

// NewRepository creates a new database repository.
func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

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

// GetProjectByPathPrefix fetches a project by its path prefix.
func (r *Repository) GetProjectByPathPrefix(ctx context.Context, pathPrefix string) (*Project, error) {
	project := &Project{}
	query := `SELECT id, user_id, name, path_prefix, upstream_url, created_at, updated_at FROM projects WHERE path_prefix = $1`

	err := r.db.QueryRowContext(ctx, query, pathPrefix).Scan(
		&project.ID,
		&project.UserID,
		&project.Name,
		&project.PathPrefix,
		&project.UpstreamURL,
		&project.CreatedAt,
		&project.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("project with path prefix '%s' not found", pathPrefix)
	} else if err != nil {
		return nil, fmt.Errorf("failed to get project by path prefix: %w", err)
	}

	log.Printf("Fetched project: %+v\n", project)
	return project, nil
}

// GetRulesByProjectID fetches all rules for a given project ID.
func (r *Repository) GetRulesByProjectID(ctx context.Context, projectID string) ([]Rule, error) {
	var rules []Rule
	query := `SELECT id, project_id, type, value, enabled, created_at, updated_at FROM rules WHERE project_id = $1 AND enabled = TRUE`


rows, err := r.db.QueryContext(ctx, query, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to query rules for project ID '%s': %w", projectID, err)
	}
	defer rows.Close()

	for rows.Next() {
		var rule Rule
		err := rows.Scan(
			&rule.ID,
			&rule.ProjectID,
			&rule.Type,
			&rule.Value,
			&rule.Enabled,
			&rule.CreatedAt,
			&rule.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan rule row: %w", err)
		}
		rules = append(rules, rule)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error after iterating rows: %w", err)
	}

	log.Printf("Fetched %d rules for project ID '%s'\n", len(rules), projectID)
	return rules, nil
}
