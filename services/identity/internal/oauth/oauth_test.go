package oauth

import (
	"testing"
	"time"
)

func TestStateStoreConsume(t *testing.T) {
	s := NewStateStore(time.Minute)
	s.Save("abc", ProviderGoogle)

	p, err := s.Consume("abc")
	if err != nil || p != ProviderGoogle {
		t.Fatalf("first consume: provider=%q err=%v", p, err)
	}
	if _, err := s.Consume("abc"); err == nil {
		t.Fatal("second consume should fail (single-use)")
	}
}

func TestStateStoreExpiry(t *testing.T) {
	s := NewStateStore(5 * time.Millisecond)
	s.Save("abc", ProviderMicrosoft)
	time.Sleep(10 * time.Millisecond)
	if _, err := s.Consume("abc"); err == nil {
		t.Fatal("expected expired state to fail")
	}
}

func TestAuthorizeURLUnknownProvider(t *testing.T) {
	c := NewConfig("", "", "", "", "https://example/callback")
	if _, err := c.AuthorizeURL("nope", "state"); err == nil {
		t.Fatal("expected unknown-provider error")
	}
}
