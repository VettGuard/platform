package middleware

import (
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/vettguard/vettguard/services/shared/pkg/tenantctx"
)

// AccessClaims mirrors identity service's claim shape. Kept here so the
// gateway can verify without importing the identity service binary. If the
// claim shape evolves, update both places (or extract to a shared module).
type AccessClaims struct {
	Sub  uuid.UUID `json:"sub"`
	Tid  uuid.UUID `json:"tid"`
	Role string    `json:"role"`
	Jti  uuid.UUID `json:"jti"`
	Iat  int64     `json:"iat"`
	Exp  int64     `json:"exp"`
	Iss  string    `json:"iss,omitempty"`
}

var (
	ErrAuthMissing   = errors.New("middleware: missing Authorization header")
	ErrAuthMalformed = errors.New("middleware: malformed bearer token")
	ErrAuthInvalid   = errors.New("middleware: token signature invalid")
	ErrAuthExpired   = errors.New("middleware: token expired")
)

// RequireAuth returns a middleware that verifies the Bearer access token
// against pub (Ed25519 public key) and populates tenantctx for downstream
// handlers. Unauthenticated requests get 401.
func RequireAuth(pub ed25519.PublicKey) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tok, err := bearerFromHeader(r.Header.Get("Authorization"))
			if err != nil {
				http.Error(w, err.Error(), http.StatusUnauthorized)
				return
			}
			claims, err := VerifyJWT(pub, tok)
			if err != nil {
				http.Error(w, err.Error(), http.StatusUnauthorized)
				return
			}
			ctx := tenantctx.With(r.Context(), tenantctx.Context{
				TenantID:  claims.Tid,
				UserID:    claims.Sub,
				Role:      claims.Role,
				RequestID: w.Header().Get(RequestIDHeader),
			})
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func bearerFromHeader(h string) (string, error) {
	if h == "" {
		return "", ErrAuthMissing
	}
	const prefix = "Bearer "
	if !strings.HasPrefix(h, prefix) {
		return "", ErrAuthMalformed
	}
	tok := strings.TrimSpace(h[len(prefix):])
	if tok == "" {
		return "", ErrAuthMalformed
	}
	return tok, nil
}

// VerifyJWT validates an EdDSA-signed JWT and returns its claims.
func VerifyJWT(pub ed25519.PublicKey, token string) (AccessClaims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return AccessClaims{}, ErrAuthMalformed
	}
	enc := base64.RawURLEncoding
	sig, err := enc.DecodeString(parts[2])
	if err != nil {
		return AccessClaims{}, ErrAuthMalformed
	}
	if !ed25519.Verify(pub, []byte(parts[0]+"."+parts[1]), sig) {
		return AccessClaims{}, ErrAuthInvalid
	}
	body, err := enc.DecodeString(parts[1])
	if err != nil {
		return AccessClaims{}, ErrAuthMalformed
	}
	var c AccessClaims
	if err := json.Unmarshal(body, &c); err != nil {
		return AccessClaims{}, ErrAuthMalformed
	}
	if time.Now().Unix() >= c.Exp {
		return c, ErrAuthExpired
	}
	return c, nil
}
