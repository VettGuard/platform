package auth

import (
	"sync"
	"time"
)

// IPRateLimiter is a minimal in-process token bucket keyed by remote IP.
//
// Scope: process-local, no Redis. Good enough to blunt brute-force against
// a single replica during Sprint 2. The gateway will add a global limiter
// in front. Buckets older than `idle` are GC'd opportunistically.
type IPRateLimiter struct {
	mu       sync.Mutex
	buckets  map[string]*bucket
	capacity int
	window   time.Duration
	idle     time.Duration
}

type bucket struct {
	tokens   int
	resetAt  time.Time
	lastSeen time.Time
}

// NewIPRateLimiter allows `capacity` events per `window` per IP.
// idle controls how long an unused bucket sticks around before GC.
func NewIPRateLimiter(capacity int, window time.Duration) *IPRateLimiter {
	return &IPRateLimiter{
		buckets:  make(map[string]*bucket),
		capacity: capacity,
		window:   window,
		idle:     10 * window,
	}
}

// Allow returns true when ip has remaining budget. Consumes one token.
func (l *IPRateLimiter) Allow(ip string) bool {
	if ip == "" {
		return true // can't rate-limit without a key — fail open
	}
	now := time.Now()

	l.mu.Lock()
	defer l.mu.Unlock()

	b, ok := l.buckets[ip]
	if !ok || now.After(b.resetAt) {
		l.buckets[ip] = &bucket{
			tokens:   l.capacity - 1,
			resetAt:  now.Add(l.window),
			lastSeen: now,
		}
		l.gcLocked(now)
		return true
	}

	b.lastSeen = now
	if b.tokens <= 0 {
		return false
	}
	b.tokens--
	return true
}

func (l *IPRateLimiter) gcLocked(now time.Time) {
	// Cheap opportunistic sweep: only when the map is sizable.
	if len(l.buckets) < 512 {
		return
	}
	for k, b := range l.buckets {
		if now.Sub(b.lastSeen) > l.idle {
			delete(l.buckets, k)
		}
	}
}
