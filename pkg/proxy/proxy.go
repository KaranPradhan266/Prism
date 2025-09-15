package proxy

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
)

// NewReverseProxy creates a reverse proxy to forward traffic to the target.
func NewReverseProxy(target string) *httputil.ReverseProxy {
	url, err := url.Parse(target)
	if err != nil {
		log.Fatalf("Invalid target URL: %v", err)
	}

	proxy := httputil.NewSingleHostReverseProxy(url)

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
