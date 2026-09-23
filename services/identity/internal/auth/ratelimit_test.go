package auth

import (
	"testing"
	"time"
)

func TestIPRateLimiter(t *testing.T) {
	l := NewIPRateLimiter(3, time.Minute)
	for i := range 3 {
		if !l.Allow("1.2.3.4") {
			t.Fatalf("call %d should be allowed", i)
		}
	}
	if l.Allow("1.2.3.4") {
		t.Fatal("4th call should be denied")
	}
	if !l.Allow("5.6.7.8") {
		t.Fatal("different IP should still have budget")
	}
}

func TestIPRateLimiterReset(t *testing.T) {
	l := NewIPRateLimiter(1, 10*time.Millisecond)
	if !l.Allow("ip") {
		t.Fatal("first allowed")
	}
	if l.Allow("ip") {
		t.Fatal("second denied")
	}
	time.Sleep(15 * time.Millisecond)
	if !l.Allow("ip") {
		t.Fatal("after window, allowed again")
	}
}

func TestIPRateLimiterEmptyKey(t *testing.T) {
	l := NewIPRateLimiter(1, time.Minute)
	a := l.Allow("")
	b := l.Allow("")
	if !a || !b {
		t.Fatal("empty IP should fail open")
	}
}
