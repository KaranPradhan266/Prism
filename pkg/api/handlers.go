package api

import (
	"fmt"
	"net/http"

	"github.com/clerk/clerk-sdk-go/v2"
)

// HelloHandler is a sample handler for a protected route.
func HelloHandler(w http.ResponseWriter, r *http.Request) {
	// Get the claims from the request context
	claims, ok := clerk.SessionClaimsFromContext(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprintln(w, "Unauthorized")
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Hello, user %s!", claims.Subject)
}
