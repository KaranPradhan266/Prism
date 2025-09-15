package firewall

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"strings"

	"prism/pkg/proxy"
	"prism/pkg/storage"
)

// Middleware uses a storage.Repository to check requests and dynamically proxy them.
func Middleware(repo *storage.Repository, proxyFactory *proxy.Factory) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			clientIP, _, _ := net.SplitHostPort(r.RemoteAddr)

			// 1. Extract path prefix for project lookup
			// Assuming path prefix is the first segment, e.g., /my-project/some/path -> /my-project
			pathSegments := strings.Split(r.URL.Path, "/")
			var pathPrefix string
			if len(pathSegments) > 1 && pathSegments[1] != "" {
				pathPrefix = "/" + pathSegments[1]
			} else {
				http.Error(w, "Not Found: Project path prefix missing", http.StatusNotFound)
				return
			}

			log.Printf("Attempting to find project for path prefix: %s\n", pathPrefix)

			// 2. Get Project from Database
			project, err := repo.GetProjectByPathPrefix(ctx, pathPrefix)
			if err != nil {
				log.Printf("Error getting project for path prefix '%s': %v\n", pathPrefix, err)
				http.Error(w, fmt.Sprintf("Not Found: Project '%s' not found or error: %v", pathPrefix, err), http.StatusNotFound)
				return
			}

			log.Printf("Found project '%s' with upstream: %s\n", project.Name, project.UpstreamURL)

			// 3. Get Rules for the Project from Database
			rules, err := repo.GetRulesByProjectID(ctx, project.ID)
			if err != nil {
				log.Printf("Error getting rules for project '%s': %v\n", project.Name, err)
				http.Error(w, fmt.Sprintf("Internal Server Error: Failed to get rules for project '%s'", project.Name), http.StatusInternalServerError)
				return
			}

			// 4. Apply Firewall Rules
			for _, rule := range rules {
				if !rule.Enabled {
					continue
				}
				switch rule.Type {
				case "ip_block":
					if clientIP == rule.Value {
						log.Printf("Blocked request from IP: %s for project '%s'\n", clientIP, project.Name)
						http.Error(w, "Forbidden: blocked by firewall", http.StatusForbidden)
						return
					}
				case "keyword_block":
					if strings.Contains(r.URL.String(), rule.Value) {
						log.Printf("Blocked request containing keyword '%s' for project '%s': %s\n", rule.Value, project.Name, r.URL.Path)
						http.Error(w, "Forbidden: blocked by firewall", http.StatusForbidden)
						return
					}
				// Add more rule types here (e.g., header_block, body_block)
				default:
					log.Printf("Warning: Unknown rule type '%s' for project '%s'\n", rule.Type, project.Name)
				}
			}

			// 5. Dynamically create and serve the reverse proxy
			// The request URL needs to be rewritten to remove the path prefix
			// e.g., /my-project/some/path -> /some/path
			originalPath := r.URL.Path
			r.URL.Path = strings.TrimPrefix(r.URL.Path, pathPrefix)
			// If the path becomes empty after trimming, set it to / to avoid issues
			if r.URL.Path == "" {
				r.URL.Path = "/"
			}
			log.Printf("Rewriting URL from '%s' to '%s' for upstream '%s'\n", originalPath, r.URL.Path, project.UpstreamURL)

			reverseProxy := proxyFactory.NewReverseProxy(project.UpstreamURL)
			reverseProxy.ServeHTTP(w, r)
		})
	}
}
