package middleware

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/vettguard/vettguard/services/shared/pkg/tenantctx"
)

func mintToken(t *testing.T, priv ed25519.PrivateKey, claims AccessClaims) string {
	t.Helper()
	header := `{"alg":"EdDSA","typ":"JWT"}`
	body, err := json.Marshal(claims)
	if err != nil {
		t.Fatal(err)
	}
	enc := base64.RawURLEncoding
	signing := enc.EncodeToString([]byte(header)) + "." + enc.EncodeToString(body)
	sig := ed25519.Sign(priv, []byte(signing))
	return signing + "." + enc.EncodeToString(sig)
}

func TestRequireAuth_OK(t *testing.T) {
	pub, priv, _ := ed25519.GenerateKey(rand.Reader)
	uid, tid := uuid.New(), uuid.New()
	tok := mintToken(t, priv, AccessClaims{
		Sub: uid, Tid: tid, Role: "owner", Jti: uuid.New(),
		Iat: time.Now().Unix(), Exp: time.Now().Add(time.Minute).Unix(),
	})

	var gotCtx tenantctx.Context
	h := RequireAuth(pub)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotCtx, _ = tenantctx.From(r.Context())
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/x", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != 200 {
		t.Fatalf("status: %d", rr.Code)
	}
	if gotCtx.UserID != uid || gotCtx.TenantID != tid || gotCtx.Role != "owner" {
		t.Fatalf("ctx mismatch: %+v", gotCtx)
	}
}

func TestRequireAuth_Missing(t *testing.T) {
	pub, _, _ := ed25519.GenerateKey(rand.Reader)
	h := RequireAuth(pub)(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, httptest.NewRequest("GET", "/", nil))
	if rr.Code != 401 {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestRequireAuth_WrongKey(t *testing.T) {
	pub1, _, _ := ed25519.GenerateKey(rand.Reader)
	_, priv2, _ := ed25519.GenerateKey(rand.Reader)
	tok := mintToken(t, priv2, AccessClaims{
		Sub: uuid.New(), Tid: uuid.New(), Role: "viewer", Jti: uuid.New(),
		Iat: time.Now().Unix(), Exp: time.Now().Add(time.Minute).Unix(),
	})

	h := RequireAuth(pub1)(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))
	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != 401 {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestRequireAuth_Expired(t *testing.T) {
	pub, priv, _ := ed25519.GenerateKey(rand.Reader)
	tok := mintToken(t, priv, AccessClaims{
		Sub: uuid.New(), Tid: uuid.New(), Role: "viewer", Jti: uuid.New(),
		Iat: time.Now().Add(-time.Hour).Unix(),
		Exp: time.Now().Add(-time.Minute).Unix(),
	})
	h := RequireAuth(pub)(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))
	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != 401 {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}
