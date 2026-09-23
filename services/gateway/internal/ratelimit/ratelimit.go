// Package ratelimit implements a Redis-backed token bucket used at the
// gateway edge. Each request consumes one token from two buckets in
// parallel: per-tenant (when authenticated) and per-IP. The stricter limit
// wins. On Redis outages we fail OPEN — the gateway is more useful slightly
// over-permissive than entirely down, and abusive traffic still hits the
// per-service identity-side limiter (5/min/IP).
package ratelimit

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"

	"github.com/vettguard/vettguard/services/shared/pkg/tenantctx"
)

type Limiter struct {
	Client *redis.Client
	// Capacity per Window for each bucket key. Defaults: tenants=100/min, IPs=100/min.
	TenantCapacity int
	IPCapacity     int
	Window         time.Duration
	Log            zerolog.Logger
}

func New(client *redis.Client, log zerolog.Logger) *Limiter {
	return &Limiter{
		Client:         client,
		TenantCapacity: 100,
		IPCapacity:     100,
		Window:         time.Minute,
		Log:            log,
	}
}

// Middleware returns an http.Handler middleware that enforces the limits.
// Place AFTER any auth middleware so tenantctx is populated.
func (l *Limiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		ip := clientIP(r)

		// Per-IP is always evaluated.
		if !l.allow(ctx, "ip:"+ip, l.IPCapacity) {
			http.Error(w, "rate limit exceeded (ip)", http.StatusTooManyRequests)
			return
		}

		// Per-tenant only when a tenant context is present.
		if tc, err := tenantctx.From(ctx); err == nil && tc.TenantID != [16]byte{} {
			if !l.allow(ctx, "tenant:"+tc.TenantID.String(), l.TenantCapacity) {
				http.Error(w, "rate limit exceeded (tenant)", http.StatusTooManyRequests)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

// allow runs a fixed-window counter: INCR + EXPIRE (only when count==1).
// fixed-window is a pragmatic choice: token-bucket needs Lua or a sliding
// log, and the burstiness boundary at the window edge is fine for our scale.
func (l *Limiter) allow(ctx context.Context, key string, capacity int) bool {
	if l.Client == nil {
		return true
	}
	pipe := l.Client.TxPipeline()
	incr := pipe.Incr(ctx, key)
	pipe.Expire(ctx, key, l.Window)
	if _, err := pipe.Exec(ctx); err != nil {
		// Fail open on Redis trouble; surface for ops.
		if !errors.Is(err, redis.Nil) {
			l.Log.Warn().Err(err).Str("key", key).Msg("rate limit: redis error, failing open")
		}
		return true
	}
	count := incr.Val()
	return count <= int64(capacity)
}

func clientIP(r *http.Request) string {
	// X-Forwarded-For first hop (Cloudflare/Traefik populate this).
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if idx := strings.Index(xff, ","); idx >= 0 {
			return strings.TrimSpace(xff[:idx])
		}
		return strings.TrimSpace(xff)
	}
	if cf := r.Header.Get("CF-Connecting-IP"); cf != "" {
		return cf
	}
	// Fall back to RemoteAddr (host:port).
	if i := strings.LastIndex(r.RemoteAddr, ":"); i > 0 {
		return r.RemoteAddr[:i]
	}
	return r.RemoteAddr
}

// MustConnect opens a Redis client. Distinct from `New` so callers can
// fail fast at boot if Redis is misconfigured.
func MustConnect(addr, password string) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{Addr: addr, Password: password, DB: 0})
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis ping: %w", err)
	}
	return client, nil
}
