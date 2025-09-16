package storage

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strings"

	// The blank import is required for the Postgres driver to register itself.
	_ "github.com/lib/pq"
)

// ErrProjectNotFound is returned when a project is not found.
var ErrProjectNotFound = fmt.Errorf("project not found")

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

// CreateProject inserts a new project into the database.
func (r *Repository) CreateProject(ctx context.Context, userID, name, pathPrefix, upstreamURL string) (*Project, error) {
	project := &Project{}
	query := `INSERT INTO projects (user_id, name, path_prefix, upstream_url) VALUES ($1, $2, $3, $4) RETURNING id, user_id, name, path_prefix, upstream_url, created_at, updated_at`

	var scannedUserID sql.NullString // Use sql.NullString for scanning

	err := r.db.QueryRowContext(ctx, query, userID, name, pathPrefix, upstreamURL).Scan(
		&project.ID,
		&scannedUserID,
		&project.Name,
		&project.PathPrefix,
		&project.UpstreamURL,
		&project.CreatedAt,
		&project.UpdatedAt,
	)

	if scannedUserID.Valid {
		project.UserID = scannedUserID // Assign if not NULL
	}

	if err != nil {
		return nil, fmt.Errorf("failed to create project: %w", err)
	}

	log.Printf("Created project: %+v\n", project)
	return project, nil
}

// GetProjectByPathPrefix fetches a project by its path prefix.
func (r *Repository) GetProjectByPathPrefix(ctx context.Context, pathPrefix string) (*Project, error) {
	project := &Project{}
	query := `SELECT id, user_id, name, path_prefix, upstream_url, created_at, updated_at FROM projects WHERE path_prefix = $1`

	var scannedUserID sql.NullString

	err := r.db.QueryRowContext(ctx, query, pathPrefix).Scan(
		&project.ID,
		&scannedUserID,
		&project.Name,
		&project.PathPrefix,
		&project.UpstreamURL,
		&project.CreatedAt,
		&project.UpdatedAt,
	)

	if scannedUserID.Valid {
		project.UserID = scannedUserID // Assign if not NULL
	}

	if err == sql.ErrNoRows {
		return nil, ErrProjectNotFound
	} else if err != nil {
		return nil, fmt.Errorf("failed to get project by path prefix: %w", err)
	}

	log.Printf("Fetched project: %+v\n", project)
	return project, nil
}

// GetProjectByIDAndUserID fetches a project by its ID and ensures it belongs to the given user ID.
func (r *Repository) GetProjectByIDAndUserID(ctx context.Context, projectID, userID string) (*Project, error) {
	project := &Project{}
	query := `SELECT id, user_id, name, path_prefix, upstream_url, created_at, updated_at FROM projects WHERE id = $1 AND user_id = $2`

	var scannedUserID sql.NullString

	err := r.db.QueryRowContext(ctx, query, projectID, userID).Scan(
		&project.ID,
		&scannedUserID,
		&project.Name,
		&project.PathPrefix,
		&project.UpstreamURL,
		&project.CreatedAt,
		&project.UpdatedAt,
	)

	if scannedUserID.Valid {
		project.UserID = scannedUserID // Assign if not NULL
	}

	if err == sql.ErrNoRows {
		return nil, ErrProjectNotFound
	} else if err != nil {
		return nil, fmt.Errorf("failed to get project by ID and user ID: %w", err)
	}

	log.Printf("Fetched project %s for user %s: %+v\n", projectID, userID, project)
	return project, nil
}

// UpdateProject updates an existing project in the database.
func (r *Repository) UpdateProject(ctx context.Context, projectID, userID string, name, pathPrefix, upstreamURL *string) (*Project, error) {
	// Start building the query dynamically
	sets := []string{}
	args := []interface{}{} 
	argCounter := 1

	if name != nil {
		sets = append(sets, fmt.Sprintf("name = $%d", argCounter))
		args = append(args, *name)
		argCounter++
	}
	if pathPrefix != nil {
		sets = append(sets, fmt.Sprintf("path_prefix = $%d", argCounter))
		args = append(args, *pathPrefix)
		argCounter++
	}
	if upstreamURL != nil {
		sets = append(sets, fmt.Sprintf("upstream_url = $%d", argCounter))
		args = append(args, *upstreamURL)
		argCounter++
	}

	if len(sets) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}

	query := fmt.Sprintf("UPDATE projects SET %s, updated_at = NOW() WHERE id = $%d AND user_id = $%d RETURNING id, user_id, name, path_prefix, upstream_url, created_at, updated_at",
		strings.Join(sets, ", "), argCounter, argCounter+1)
	args = append(args, projectID, userID)

	project := &Project{}
	var scannedUserID sql.NullString

	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&project.ID,
		&scannedUserID,
		&project.Name,
		&project.PathPrefix,
		&project.UpstreamURL,
		&project.CreatedAt,
		&project.UpdatedAt,
	)

	if scannedUserID.Valid {
		project.UserID = scannedUserID // Assign if not NULL
	}

	if err == sql.ErrNoRows {
		return nil, ErrProjectNotFound
	} else if err != nil {
		return nil, fmt.Errorf("failed to update project: %w", err)
	}

	log.Printf("Updated project %s for user %s: %+v\n", projectID, userID, project)
	return project, nil
}

// GetProjectsByUserID fetches all projects for a given user ID.
func (r *Repository) GetProjectsByUserID(ctx context.Context, userID string) ([]Project, error) {
	var projects []Project
	query := `SELECT id, user_id, name, path_prefix, upstream_url, created_at, updated_at FROM projects WHERE user_id = $1`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query projects for user ID '%s': %w", userID, err)
	}
	defer rows.Close()

	for rows.Next() {
		var project Project
		var scannedUserID sql.NullString

		err := rows.Scan(
			&project.ID,
			&scannedUserID,
			&project.Name,
			&project.PathPrefix,
			&project.UpstreamURL,
			&project.CreatedAt,
			&project.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan project row: %w", err)
		}

		if scannedUserID.Valid {
			project.UserID = scannedUserID // Assign if not NULL
		}
		projects = append(projects, project)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error after iterating rows: %w", err)
	}

	log.Printf("Fetched %d projects for user ID '%s'\n", len(projects), userID)
	return projects, nil
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

// DeleteProject deletes an existing project from the database.
func (r *Repository) DeleteProject(ctx context.Context, projectID, userID string) error {
	query := `DELETE FROM projects WHERE id = $1 AND user_id = $2`

	result, err := r.db.ExecContext(ctx, query, projectID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete project: %w", err)
	}


rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ErrProjectNotFound
	}

	log.Printf("Deleted project %s for user %s\n", projectID, userID)
	return nil
}
