package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"prism/pkg/storage"
)

// CreateProjectRequest defines the structure for creating a new project.
type CreateProjectRequest struct {
	Name        string `json:"name"`
	PathPrefix  string `json:"path_prefix"`
	UpstreamURL string `json:"upstream_url"`
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
