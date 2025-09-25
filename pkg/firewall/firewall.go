package firewall

import (
	"fmt"
	"net"
	"net/http"
	"prism/pkg/cache"
	"prism/pkg/logger"
	"prism/pkg/proxy"
	"prism/pkg/storage"
	"prism/pkg/websockets"
	"strings"
)

// Middleware uses a storage.Repository and a cache to check requests and dynamically proxy them.
func Middleware(repo *storage.Repository, projectCache cache.ProjectCache, ruleCache cache.RuleCache, proxyFactory *proxy.Factory, hub *websockets.Hub) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			clientIP, _, _ := net.SplitHostPort(r.RemoteAddr)

			// 1. Extract path prefix for project lookup
			pathSegments := strings.Split(r.URL.Path, "/")
			var pathPrefix string
			if len(pathSegments) > 1 && pathSegments[1] != "" {
				pathPrefix = "/" + pathSegments[1]
			} else {
				http.Error(w, "Not Found: Project path prefix missing", http.StatusNotFound)
				return
			}

			// 2. Get Project from cache or database
			project, found := projectCache.Get(pathPrefix)
			if !found {
				logger.LogAndBroadcast(hub, "", "PROJECT CACHE MISS for path prefix: %s", pathPrefix)
				var err error
				project, err = repo.GetProjectByPathPrefix(ctx, pathPrefix)
				if err != nil {
					logger.LogAndBroadcast(hub, "", "Error getting project for path prefix '%s': %v", pathPrefix, err)
					http.Error(w, fmt.Sprintf("Not Found: Project '%s' not found or error: %v", pathPrefix, err), http.StatusNotFound)
					return
				}
				projectCache.Set(pathPrefix, project) // Store in cache for next time
			} else {
				logger.LogAndBroadcast(hub, "", "PROJECT CACHE HIT for path prefix: %s", pathPrefix)
			}

			logger.LogAndBroadcast(hub, project.ID, "Found project '%s' with upstream: %s", project.Name, project.UpstreamURL)

			// 3. Get Rules for the Project (from cache or database)
			rules, found := ruleCache.Get(project.ID)
			if !found {
				logger.LogAndBroadcast(hub, project.ID, "CACHE MISS for project %s. Fetching rules from DB.", project.ID)
				//var dbRules []storage.Rule
				dbRules, err := repo.GetRulesByProjectID(ctx, project.UserID, project.ID)
				if err != nil {
					logger.LogAndBroadcast(hub, project.ID, "Error getting rules for project '%s': %v", project.Name, err)
					http.Error(w, fmt.Sprintf("Internal Server Error: Failed to get rules for project '%s'", project.Name), http.StatusInternalServerError)
					return
				}
				rules = dbRules
				ruleCache.Set(project.ID, rules) // Store in cache for next time
			} else {
				logger.LogAndBroadcast(hub, project.ID, "CACHE HIT for project %s.", project.ID)
			}

			// 4. Apply Firewall Rules
			for _, rule := range rules {
				if !rule.Enabled {
					continue
				}
				switch rule.Type {
				case "ip_block":
					if clientIP == rule.Value {
						logger.LogAndBroadcast(hub, project.ID, "Blocked request from IP: %s for project '%s'", clientIP, project.Name)
						http.Error(w, "Forbidden: blocked by firewall", http.StatusForbidden)
						return
					}
				case "keyword_block":
					if strings.Contains(r.URL.String(), rule.Value) {
						logger.LogAndBroadcast(hub, project.ID, "Blocked request containing keyword '%s' for project '%s': %s", rule.Value, project.Name, r.URL.Path)
						http.Error(w, "Forbidden: blocked by firewall", http.StatusForbidden)
						return
					}
				// Add more rule types here (e.g., header_block, body_block)
				default:
					http.Error(w, fmt.Sprintf("Internal Server Error: Unknown rule type '%s'", rule.Type), http.StatusInternalServerError)
					return
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
			logger.LogAndBroadcast(hub, project.ID, "Rewriting URL from '%s' to '%s' for upstream '%s'", originalPath, r.URL.Path, project.UpstreamURL)

			reverseProxy := proxyFactory.NewReverseProxy(project.UpstreamURL)
			reverseProxy.ServeHTTP(w, r)
		})
	}
}
