package proxy

import (
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"
)

// Factory is a factory for creating reverse proxies.
type Factory struct{}

// NewFactory creates a new proxy factory.
func NewFactory() *Factory {
	return &Factory{}
}

// NewReverseProxy creates a reverse proxy to forward traffic to the target.
func (f *Factory) NewReverseProxy(target string) *httputil.ReverseProxy {
	url, err := url.Parse(target)
	if err != nil {
		log.Fatalf("Invalid target URL: %v", err)
	}

	proxy := httputil.NewSingleHostReverseProxy(url)

	// Create a custom transport with increased connection pooling
	transport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		ForceAttemptHTTP2:     true,
		MaxIdleConns:          100,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
		MaxIdleConnsPerHost:   100, // Increase this value
	}
	proxy.Transport = transport

	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Header.Add("X-Mini-NGFW", "true")
	}

	proxy.ModifyResponse = func(resp *http.Response) error {
		log.Printf("Response from backend: %d\n", resp.StatusCode)
		return nil
	}

	return proxy
}
