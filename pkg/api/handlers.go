package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"prism/pkg/storage"
)

// CreateProjectRequest defines the structure for creating a new project.
type CreateProjectRequest struct {
	Name        string `json:"name"`
	PathPrefix  string `json:"path_prefix"`
	UpstreamURL string `json:"upstream_url"`
}

// UpdateProjectRequest defines the structure for updating an existing project.
type UpdateProjectRequest struct {
	Name        *string `json:"name,omitempty"`
	PathPrefix  *string `json:"path_prefix,omitempty"`
	UpstreamURL *string `json:"upstream_url,omitempty"`
}

// CreateRuleRequest defines the structure for creating a new rule.
type CreateRuleRequest struct {
	Type    string `json:"type"`
	Value   string `json:"value"`
	Enabled bool   `json:"enabled"`
}

// UpdateRuleRequest defines the structure for updating an existing rule.
type UpdateRuleRequest struct {
	Type    *string `json:"type,omitempty"`
	Value   *string `json:"value,omitempty"`
	Enabled *bool   `json:"enabled,omitempty"`
}

// HelloHandler is a sample handler for an API route.
func HelloHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromContext(r.Context())
	if !ok {
		// This should ideally not happen if AuthMiddleware is correctly applied
		http.Error(w, "Internal Server Error: User ID not found in context", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Hello from the Prism API, user %s!\n", userID)
}

// CreateProjectHandler handles the creation of new projects.
func CreateProjectHandler(repo *storage.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Ensure only POST requests are handled
		if r.Method != http.MethodPost {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		// Extract user ID from context
		userID, ok := GetUserIDFromContext(r.Context())
		if !ok {
			http.Error(w, "Internal Server Error: User ID not found in context", http.StatusInternalServerError)
			return
		}

		// Parse request body
		var req CreateProjectRequest
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Basic validation
		if req.Name == "" || req.PathPrefix == "" || req.UpstreamURL == "" {
			http.Error(w, "Name, PathPrefix, and UpstreamURL are required", http.StatusBadRequest)
			return
		}

		// Create project in database
		project, err := repo.CreateProject(r.Context(), userID, req.Name, req.PathPrefix, req.UpstreamURL)
		if err != nil {
			log.Printf("Error creating project for user %s: %v\n", userID, err)
			http.Error(w, "Failed to create project", http.StatusInternalServerError)
			return
		}

		// Respond with created project
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(project)
	}
}

// ListProjectsHandler handles listing projects for the authenticated user.
func ListProjectsHandler(repo *storage.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Ensure only GET requests are handled
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		// Extract user ID from context
		userID, ok := GetUserIDFromContext(r.Context())
		if !ok {
			http.Error(w, "Internal Server Error: User ID not found in context", http.StatusInternalServerError)
			return
		}

		// Get projects from database
		projects, err := repo.GetProjectsByUserID(r.Context(), userID)
		if err != nil {
			log.Printf("Error listing projects for user %s: %v\n", userID, err)
			http.Error(w, "Failed to list projects", http.StatusInternalServerError)
			return
		}

		// Respond with list of projects
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(projects)
	}
}

// UpdateProjectHandler handles updating an existing project.
func UpdateProjectHandler(repo *storage.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Ensure only PUT requests are handled
		if r.Method != http.MethodPut {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		// Extract project ID from URL path
		pathSegments := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/v1/projects/"), "/")
		if len(pathSegments) == 0 || pathSegments[0] == "" {
			http.Error(w, "Bad Request: Project ID missing", http.StatusBadRequest)
			return
		}
		projectID := pathSegments[0]

		// Extract user ID from context
		userID, ok := GetUserIDFromContext(r.Context())
		if !ok {
			http.Error(w, "Internal Server Error: User ID not found in context", http.StatusInternalServerError)
			return
		}

		// Parse request body
		var req UpdateProjectRequest
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Update project in database
		project, err := repo.UpdateProject(r.Context(), projectID, userID, req.Name, req.PathPrefix, req.UpstreamURL)
		if err != nil {
			if err == storage.ErrProjectNotFound {
				http.Error(w, "Not Found: Project not found or not owned by user", http.StatusNotFound)
				return
			}
			log.Printf("Error updating project %s for user %s: %v\n", projectID, userID, err)
			http.Error(w, "Failed to update project", http.StatusInternalServerError)
			return
		}

		// Respond with updated project
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(project)
	}
}

// GetProjectByIDHandler handles fetching a single project by ID for the authenticated user.
func GetProjectByIDHandler(repo *storage.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Ensure only GET requests are handled
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		// Extract project ID from URL path
		// Expected format: /api/v1/projects/{id}
		pathSegments := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/v1/projects/"), "/")
		if len(pathSegments) == 0 || pathSegments[0] == "" {
			http.Error(w, "Bad Request: Project ID missing", http.StatusBadRequest)
			return
		}
		projectID := pathSegments[0]

		// Extract user ID from context
		userID, ok := GetUserIDFromContext(r.Context())
		if !ok {
			http.Error(w, "Internal Server Error: User ID not found in context", http.StatusInternalServerError)
			return
		}

		// Get project from database
		project, err := repo.GetProjectByIDAndUserID(r.Context(), projectID, userID)
		if err != nil {
			if err == storage.ErrProjectNotFound {
				http.Error(w, "Not Found: Project not found or not owned by user", http.StatusNotFound)
				return
			}
			log.Printf("Error getting project %s for user %s: %v\n", projectID, userID, err)
			http.Error(w, "Failed to get project", http.StatusInternalServerError)
			return
		}

		// Respond with project
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(project)
	}
}

// DeleteProjectHandler handles deleting an existing project.
func DeleteProjectHandler(repo *storage.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Ensure only DELETE requests are handled
		if r.Method != http.MethodDelete {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		// Extract project ID from URL path
		pathSegments := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/v1/projects/"), "/")
		if len(pathSegments) == 0 || pathSegments[0] == "" {
			http.Error(w, "Bad Request: Project ID missing", http.StatusBadRequest)
			return
		}
		projectID := pathSegments[0]

		// Extract user ID from context
		userID, ok := GetUserIDFromContext(r.Context())
		if !ok {
			http.Error(w, "Internal Server Error: User ID not found in context", http.StatusInternalServerError)
			return
		}

		// Delete project from database
		err := repo.DeleteProject(r.Context(), projectID, userID)
		if err != nil {
			if err == storage.ErrProjectNotFound {
				http.Error(w, "Not Found: Project not found or not owned by user", http.StatusNotFound)
				return
			}
			log.Printf("Error deleting project %s for user %s: %v\n", projectID, userID, err)
			http.Error(w, "Failed to delete project", http.StatusInternalServerError)
			return
		}

		// Respond with No Content
		w.WriteHeader(http.StatusNoContent)
	}
}

// CreateRuleHandler handles the creation of new rules for a project.
func CreateRuleHandler(repo *storage.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		userID, ok := GetUserIDFromContext(r.Context())
		if !ok {
			http.Error(w, "Internal Server Error: User ID not found in context", http.StatusInternalServerError)
			return
		}

		// Extract project ID from URL, e.g., /api/v1/projects/{projectID}/rules
		pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(pathParts) < 4 {
			http.Error(w, "Bad Request: Invalid URL format", http.StatusBadRequest)
			return
		}
		projectID := pathParts[3]

		var req CreateRuleRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if req.Type == "" || req.Value == "" {
			http.Error(w, "Type and Value are required fields", http.StatusBadRequest)
			return
		}

		rule, err := repo.CreateRule(r.Context(), userID, projectID, req.Type, req.Value, req.Enabled)
		if err != nil {
			if err == storage.ErrProjectNotFound {
				http.Error(w, "Not Found: Project not found or not owned by user", http.StatusNotFound)
				return
			}
			log.Printf("Error creating rule for project %s: %v", projectID, err)
			http.Error(w, "Failed to create rule", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(rule)
	}
}

// ListRulesHandler handles listing all rules for a project.
func ListRulesHandler(repo *storage.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		userID, ok := GetUserIDFromContext(r.Context())
		if !ok {
			http.Error(w, "Internal Server Error: User ID not found in context", http.StatusInternalServerError)
			return
		}

		// Extract project ID from URL, e.g., /api/v1/projects/{projectID}/rules
		pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(pathParts) < 4 {
			http.Error(w, "Bad Request: Invalid URL format", http.StatusBadRequest)
			return
		}
		projectID := pathParts[3]

		rules, err := repo.GetRulesByProjectID(r.Context(), userID, projectID)
		if err != nil {
			if err == storage.ErrProjectNotFound {
				http.Error(w, "Not Found: Project not found or not owned by user", http.StatusNotFound)
				return
			}
			log.Printf("Error listing rules for project %s: %v", projectID, err)
			http.Error(w, "Failed to list rules", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(rules)
	}
}

// GetRuleHandler handles fetching a single rule by its ID.
func GetRuleHandler(repo *storage.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		userID, ok := GetUserIDFromContext(r.Context())
		if !ok {
			http.Error(w, "Internal Server Error: User ID not found in context", http.StatusInternalServerError)
			return
		}

		// Extract project ID and rule ID from URL
		// e.g., /api/v1/projects/{projectID}/rules/{ruleID}
		pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(pathParts) != 6 { // expecting 6 parts: "api", "v1", "projects", {projectID}, "rules", {ruleID}
			http.Error(w, "Bad Request: Invalid URL format for getting a rule", http.StatusBadRequest)
			return
		}
		projectID := pathParts[3]
		ruleID := pathParts[5]

		rule, err := repo.GetRuleByID(r.Context(), userID, projectID, ruleID)
		if err != nil {
			if err == storage.ErrRuleNotFound {
				http.Error(w, "Not Found: Rule not found or you do not have permission to access it", http.StatusNotFound)
				return
			}
			log.Printf("Error getting rule %s for project %s: %v", ruleID, projectID, err)
			http.Error(w, "Failed to get rule", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(rule)
	}
}

// UpdateRuleHandler handles updating an existing rule.
func UpdateRuleHandler(repo *storage.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		userID, ok := GetUserIDFromContext(r.Context())
		if !ok {
			http.Error(w, "Internal Server Error: User ID not found in context", http.StatusInternalServerError)
			return
		}

		// Extract project ID and rule ID from URL
		pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(pathParts) != 6 {
			http.Error(w, "Bad Request: Invalid URL format for updating a rule", http.StatusBadRequest)
			return
		}
		projectID := pathParts[3]
		ruleID := pathParts[5]

		// Parse request body
		var req UpdateRuleRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Update rule in the database
		updatedRule, err := repo.UpdateRule(r.Context(), userID, projectID, ruleID, req.Type, req.Value, req.Enabled)
		if err != nil {
			if err == storage.ErrRuleNotFound {
				http.Error(w, "Not Found: Rule not found or you do not have permission to access it", http.StatusNotFound)
				return
			}
			if strings.Contains(err.Error(), "no fields to update") {
				http.Error(w, "Bad Request: No fields provided to update", http.StatusBadRequest)
				return
			}
			log.Printf("Error updating rule %s: %v", ruleID, err)
			http.Error(w, "Failed to update rule", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(updatedRule)
	}
}