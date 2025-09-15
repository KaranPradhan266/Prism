package firewall

import (
	"log"
	"net"
	"net/http"
	"strings"
)

// RuleProvider defines the interface for any rule source (in-memory, file, DB).
type RuleProvider interface {
	GetBlockedIPs() []string
	GetBlockedKeywords() []string
}

// InMemoryRuleProvider is an in-memory implementation of RuleProvider.
type InMemoryRuleProvider struct {
	blockedIPs      []string
	blockedKeywords []string
}

// NewInMemoryRuleProvider creates a new in-memory rule provider with default rules.
func NewInMemoryRuleProvider() *InMemoryRuleProvider {
	return &InMemoryRuleProvider{
		blockedIPs:      []string{"1.2.3.4"}, // Example IP
		blockedKeywords: []string{"badword", "attack", "forbidden"},
	}
}

func (p *InMemoryRuleProvider) GetBlockedIPs() []string {
	return p.blockedIPs
}

func (p *InMemoryRuleProvider) GetBlockedKeywords() []string {
	return p.blockedKeywords
}

// Middleware uses a RuleProvider to check requests.
func Middleware(next http.Handler, rules RuleProvider) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		clientIP, _, _ := net.SplitHostPort(r.RemoteAddr)

		// 1. Block by IP
		for _, ip := range rules.GetBlockedIPs() {
			if clientIP == ip {
				log.Printf("Blocked request from IP: %s\n", clientIP)
				http.Error(w, "Forbidden: blocked by firewall", http.StatusForbidden)
				return
			}
		}

		// 2. Block by keyword in URL path/query
		for _, keyword := range rules.GetBlockedKeywords() {
			if strings.Contains(r.URL.String(), keyword) {
				log.Printf("Blocked request containing keyword '%s': %s\n", keyword, r.URL.String())
				http.Error(w, "Forbidden: blocked by firewall", http.StatusForbidden)
				return
			}
		}

		// If not blocked, continue to proxy
		next.ServeHTTP(w, r)
	})
}
