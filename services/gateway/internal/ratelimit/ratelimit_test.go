package ratelimit

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/rs/zerolog"
)

func TestClientIPFromXForwardedFor(t *testing.T) {
	r := httptest.NewRequest("GET", "/", nil)
	r.Header.Set("X-Forwarded-For", "203.0.113.7, 10.0.0.1")
	if got := clientIP(r); got != "203.0.113.7" {
		t.Fatalf("got %q", got)
	}
}

func TestClientIPFromCloudflareHeader(t *testing.T) {
	r := httptest.NewRequest("GET", "/", nil)
	r.Header.Set("CF-Connecting-IP", "198.51.100.42")
	if got := clientIP(r); got != "198.51.100.42" {
		t.Fatalf("got %q", got)
	}
}

func TestClientIPFallbackRemoteAddr(t *testing.T) {
	r := httptest.NewRequest("GET", "/", nil)
	r.RemoteAddr = "192.0.2.1:54321"
	if got := clientIP(r); got != "192.0.2.1" {
		t.Fatalf("got %q", got)
	}
}

func TestMiddlewareFailsOpenWithoutRedis(t *testing.T) {
	// nil Redis client → allow everything (verifies fail-open behaviour for dev).
	l := New(nil, zerolog.Nop())
	called := false
	h := l.Middleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		called = true
		w.WriteHeader(200)
	}))
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, httptest.NewRequest("GET", "/", nil))
	if !called || rr.Code != 200 {
		t.Fatalf("expected pass-through, got %d called=%v", rr.Code, called)
	}
}
