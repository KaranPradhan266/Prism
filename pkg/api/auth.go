package api

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	jwt "github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware creates a middleware to verify Supabase JWTs locally.
func AuthMiddleware(jwtSecret string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Set common headers for JSON error responses
			w.Header().Set("Content-Type", "application/json")

			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized", "message": "Authorization header missing"})
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized", "message": "Invalid Authorization header format"})
				return
			}
			tokenString := parts[1]

			// Parse and verify the JWT token locally
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				// Validate the alg is what you expect: HS256
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(jwtSecret), nil
			}, jwt.WithValidMethods([]string{"HS256"}), jwt.WithLeeway(5*time.Second))

			if err != nil {
				log.Printf("JWT parsing/verification failed: %v\n", err)
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized", "message": "Invalid or expired token"})
				return
			}

			if !token.Valid {
				log.Printf("Invalid token: %v\n", token)
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized", "message": "Invalid token"})
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				log.Printf("Invalid token claims format: %v\n", token.Claims)
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{"error": "internal_error", "message": "Invalid token claims format"})
				return
			}

			// Extract user ID (sub claim)
			userID, ok := claims["sub"].(string)
			if !ok || userID == "" {
				log.Printf("User ID (sub) not found in claims: %v\n", claims)
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{"error": "internal_error", "message": "User ID missing from token claims"})
				return
			}

			// Add user ID to request context
			ctxWithUser := context.WithValue(r.Context(), "userID", userID)
			r = r.WithContext(ctxWithUser)

			log.Printf("Request authenticated for user: %s\n", userID)
			next.ServeHTTP(w, r)
		})
	}
}

// GetUserIDFromContext retrieves the user ID from the request context.
func GetUserIDFromContext(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value("userID").(string)
	return userID, ok
}
