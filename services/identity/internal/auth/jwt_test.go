package auth

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func newTestSigner(t *testing.T) *JWTSigner {
	t.Helper()
	k, err := GenerateSigningKey()
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	s, err := NewJWTSigner(k)
	if err != nil {
		t.Fatalf("new signer: %v", err)
	}
	return s
}

func TestJWTRoundTrip(t *testing.T) {
	s := newTestSigner(t)
	uid, tid := uuid.New(), uuid.New()
	tok, claims, err := s.IssueAccess(uid, tid, "owner")
	if err != nil {
		t.Fatal(err)
	}
	got, err := s.Verify(tok)
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if got.Sub != uid || got.Tid != tid || got.Role != "owner" || got.Jti != claims.Jti {
		t.Fatalf("claims mismatch: %+v", got)
	}
}

func TestJWTSignatureRejected(t *testing.T) {
	s1 := newTestSigner(t)
	s2 := newTestSigner(t)
	tok, _, _ := s1.IssueAccess(uuid.New(), uuid.New(), "viewer")
	if _, err := s2.Verify(tok); err == nil {
		t.Fatal("expected signature mismatch error")
	}
}

func TestJWTExpired(t *testing.T) {
	s := newTestSigner(t)
	c := AccessClaims{
		Sub: uuid.New(), Tid: uuid.New(), Role: "viewer",
		Jti: uuid.New(),
		Iat: time.Now().Add(-time.Hour).Unix(),
		Exp: time.Now().Add(-time.Minute).Unix(),
		Iss: jwtIssuer,
	}
	tok, err := s.sign(c)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s.Verify(tok); err != ErrTokenExpired {
		t.Fatalf("expected ErrTokenExpired, got %v", err)
	}
}

func TestJWTMalformed(t *testing.T) {
	s := newTestSigner(t)
	if _, err := s.Verify("not-a-jwt"); err != ErrTokenMalformed {
		t.Fatalf("expected ErrTokenMalformed, got %v", err)
	}
}
