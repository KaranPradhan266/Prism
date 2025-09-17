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

// ErrRuleNotFound is returned when a rule is not found.
var ErrRuleNotFound = fmt.Errorf("rule not found")

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

	err := r.db.QueryRowContext(ctx, query, userID, name, pathPrefix, upstreamURL).Scan(
		&project.ID,
		&project.UserID,
		&project.Name,
		&project.PathPrefix,
		&project.UpstreamURL,
		&project.CreatedAt,
		&project.UpdatedAt,
	)

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

	err := r.db.QueryRowContext(ctx, query, projectID, userID).Scan(
		&project.ID,
		&project.UserID,
		&project.Name,
		&project.PathPrefix,
		&project.UpstreamURL,
		&project.CreatedAt,
		&project.UpdatedAt,
	)

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
	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&project.ID,
		&project.UserID,
		&project.Name,
		&project.PathPrefix,
		&project.UpstreamURL,
		&project.CreatedAt,
		&project.UpdatedAt,
	)

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
		err := rows.Scan(
			&project.ID,
			&project.UserID,
			&project.Name,
			&project.PathPrefix,
			&project.UpstreamURL,
			&project.CreatedAt,
			&project.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan project row: %w", err)
		}
		projects = append(projects, project)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error after iterating rows: %w", err)
	}

	log.Printf("Fetched %d projects for user ID '%s'\n", len(projects), userID)
	return projects, nil
}

// GetRulesByProjectID fetches all rules for a given project ID after verifying user ownership.
func (r *Repository) GetRulesByProjectID(ctx context.Context, userID, projectID string) ([]Rule, error) {
	// 1. Verify the user owns the project.
	var ownerUserID string
	err := r.db.QueryRowContext(ctx, "SELECT user_id FROM projects WHERE id = $1", projectID).Scan(&ownerUserID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrProjectNotFound
		}
		return nil, fmt.Errorf("failed to verify project ownership for listing rules: %w", err)
	}

	if ownerUserID != userID {
		return nil, ErrProjectNotFound
	}

	// 2. Fetch the rules for the project.
	var rules []Rule
	query := `SELECT id, project_id, type, value, enabled, created_at, updated_at FROM rules WHERE project_id = $1`


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

// GetRuleByID fetches a single rule by its ID, ensuring it belongs to the correct user and project.
func (r *Repository) GetRuleByID(ctx context.Context, userID, projectID, ruleID string) (*Rule, error) {
	rule := &Rule{}
	query := `
		SELECT r.id, r.project_id, r.type, r.value, r.enabled, r.created_at, r.updated_at
		FROM rules r
		JOIN projects p ON r.project_id = p.id
		WHERE r.id = $1 AND r.project_id = $2 AND p.user_id = $3`

	err := r.db.QueryRowContext(ctx, query, ruleID, projectID, userID).Scan(
		&rule.ID,
		&rule.ProjectID,
		&rule.Type,
		&rule.Value,
		&rule.Enabled,
		&rule.CreatedAt,
		&rule.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrRuleNotFound
	} else if err != nil {
		return nil, fmt.Errorf("failed to get rule by ID: %w", err)
	}

	log.Printf("Fetched rule %s for project %s user %s", ruleID, projectID, userID)
	return rule, nil
}

// UpdateRule updates an existing rule, verifying ownership via a join to the projects table.
func (r *Repository) UpdateRule(ctx context.Context, userID, projectID, ruleID string, ruleType, value *string, enabled *bool) (*Rule, error) {
	sets := []string{}
	args := []interface{}{}
	argCounter := 1

	if ruleType != nil {
		sets = append(sets, fmt.Sprintf("type = $%d", argCounter))
		args = append(args, *ruleType)
		argCounter++
	}
	if value != nil {
		sets = append(sets, fmt.Sprintf("value = $%d", argCounter))
		args = append(args, *value)
		argCounter++
	}
	if enabled != nil {
		sets = append(sets, fmt.Sprintf("enabled = $%d", argCounter))
		args = append(args, *enabled)
		argCounter++
	}

	if len(sets) == 0 {
		return nil, fmt.Errorf("no fields to update")
	}

	// Add the WHERE clause parameters to the args list
	args = append(args, ruleID, projectID, userID)

	// We use a subquery in the WHERE clause to check for project ownership.
	// This is a common pattern to perform an update based on a join condition.
	query := fmt.Sprintf(`
		UPDATE rules
		SET %s, updated_at = NOW()
		WHERE id = $%d AND project_id = $%d
		  AND project_id IN (SELECT id FROM projects WHERE user_id = $%d)
		RETURNING id, project_id, type, value, enabled, created_at, updated_at`,
		strings.Join(sets, ", "), argCounter, argCounter+1, argCounter+2)

	updatedRule := &Rule{}
	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&updatedRule.ID,
		&updatedRule.ProjectID,
		&updatedRule.Type,
		&updatedRule.Value,
		&updatedRule.Enabled,
		&updatedRule.CreatedAt,
		&updatedRule.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrRuleNotFound // If no row was updated, the rule was not found for this user
	} else if err != nil {
		return nil, fmt.Errorf("failed to update rule: %w", err)
	}

	log.Printf("Updated rule %s", ruleID)
	return updatedRule, nil
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

// CreateRule adds a new rule to a project, verifying ownership first.
func (r *Repository) CreateRule(ctx context.Context, userID, projectID, ruleType, value string, enabled bool) (*Rule, error) {
	// 1. Verify the user owns the project.
	var ownerUserID string
	err := r.db.QueryRowContext(ctx, "SELECT user_id FROM projects WHERE id = $1", projectID).Scan(&ownerUserID)
	if err != nil {
		if err == sql.ErrNoRows {
			// Use the existing ErrProjectNotFound for consistency.
			return nil, ErrProjectNotFound
		}
		return nil, fmt.Errorf("failed to verify project ownership: %w", err)
	}

	if ownerUserID != userID {
		// If the user ID does not match, treat it as if the project was not found.
		return nil, ErrProjectNotFound
	}

	// 2. Insert the new rule.
	rule := &Rule{}
	query := `
		INSERT INTO rules (project_id, type, value, enabled) 
		VALUES ($1, $2, $3, $4) 
		RETURNING id, project_id, type, value, enabled, created_at, updated_at
	`
	err = r.db.QueryRowContext(ctx, query, projectID, ruleType, value, enabled).Scan(
		&rule.ID,
		&rule.ProjectID,
		&rule.Type,
		&rule.Value,
		&rule.Enabled,
		&rule.CreatedAt,
		&rule.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create rule: %w", err)
	}

	log.Printf("Created rule for project %s: %+v\n", projectID, rule)
	return rule, nil
}