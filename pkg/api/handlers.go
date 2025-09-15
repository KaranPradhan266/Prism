package api

import (
	"fmt"
	"net/http"
)

// HelloHandler is a sample handler for an API route.
func HelloHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Hello from the Prism API!")
}
