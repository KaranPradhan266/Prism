package cache

import (
	"sync"

	"prism/pkg/storage"
)

// RuleCache defines the interface for a cache that stores firewall rules.
// This allows for different implementations (e.g., in-memory, Redis) to be used interchangeably.
type RuleCache interface {
	Get(projectID string) ([]storage.Rule, bool)
	Set(projectID string, rules []storage.Rule)
	Clear(projectID string)
}

// InMemoryCache is a thread-safe, in-memory implementation of the RuleCache interface.
type InMemoryCache struct {
	mu    sync.RWMutex
	cache map[string][]storage.Rule
}

// NewInMemoryCache creates and returns a new InMemoryCache instance.
func NewInMemoryCache() *InMemoryCache {
	return &InMemoryCache{
		cache: make(map[string][]storage.Rule),
	}
}

// Get retrieves a list of rules for a given projectID from the cache.
// The boolean return value indicates whether the item was found in the cache.
func (c *InMemoryCache) Get(projectID string) ([]storage.Rule, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	rules, found := c.cache[projectID]
	return rules, found
}

// Set adds or updates the list of rules for a given projectID in the cache.
func (c *InMemoryCache) Set(projectID string, rules []storage.Rule) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.cache[projectID] = rules
}

// Clear removes the rules for a given projectID from the cache.
// This is used for cache invalidation.
func (c *InMemoryCache) Clear(projectID string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.cache, projectID)
}
