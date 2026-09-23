package auth

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

// AccessClaims is the payload baked into every access JWT.
// Kept minimal on purpose — anything dynamic (permissions, plan tier) is
// resolved by the gateway against the DB on each request, not trusted from
// the token. Tokens are short-lived (15 min) so claim staleness is bounded.
type AccessClaims struct {
	Sub  uuid.UUID `json:"sub"`           // user id
	Tid  uuid.UUID `json:"tid"`           // tenant id (chosen at login)
	Role string    `json:"role"`          // membership role at issue time
	Jti  uuid.UUID `json:"jti"`           // unique token id
	Iat  int64     `json:"iat"`           // unix seconds
	Exp  int64     `json:"exp"`           // unix seconds
	Iss  string    `json:"iss,omitempty"` // "vettguard-identity"
}

var (
	ErrTokenMalformed = errors.New("auth: jwt malformed")
	ErrTokenSignature = errors.New("auth: jwt signature invalid")
	ErrTokenExpired   = errors.New("auth: jwt expired")
)

const (
	accessTTL = 15 * time.Minute
	jwtIssuer = "vettguard-identity"
)

// JWTSigner produces and verifies EdDSA (Ed25519) JWTs. Hold one per process;
// rotate the underlying key out-of-band (JWT_SIGNING_KEY env var).
type JWTSigner struct {
	priv ed25519.PrivateKey
	pub  ed25519.PublicKey
}

// NewJWTSigner accepts a base64-encoded Ed25519 seed (32 bytes) or full
// private key (64 bytes). Generate one with `openssl rand -base64 32`.
func NewJWTSigner(b64Key string) (*JWTSigner, error) {
	raw, err := base64.StdEncoding.DecodeString(strings.TrimSpace(b64Key))
	if err != nil {
		return nil, fmt.Errorf("decode signing key: %w", err)
	}
	var priv ed25519.PrivateKey
	switch len(raw) {
	case ed25519.SeedSize:
		priv = ed25519.NewKeyFromSeed(raw)
	case ed25519.PrivateKeySize:
		priv = ed25519.PrivateKey(raw)
	default:
		return nil, fmt.Errorf("signing key must be %d or %d bytes, got %d",
			ed25519.SeedSize, ed25519.PrivateKeySize, len(raw))
	}
	return &JWTSigner{priv: priv, pub: priv.Public().(ed25519.PublicKey)}, nil
}

// GenerateSigningKey is a helper for bootstrapping environments. Prints a
// base64 seed safe to drop into JWT_SIGNING_KEY.
func GenerateSigningKey() (string, error) {
	seed := make([]byte, ed25519.SeedSize)
	if _, err := rand.Read(seed); err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(seed), nil
}

// PublicKey returns the raw Ed25519 public key for JWKS publication.
func (s *JWTSigner) PublicKey() ed25519.PublicKey { return s.pub }

// IssueAccess signs a new access token for (user, tenant, role).
func (s *JWTSigner) IssueAccess(userID, tenantID uuid.UUID, role string) (string, AccessClaims, error) {
	now := time.Now().UTC()
	claims := AccessClaims{
		Sub:  userID,
		Tid:  tenantID,
		Role: role,
		Jti:  uuid.New(),
		Iat:  now.Unix(),
		Exp:  now.Add(accessTTL).Unix(),
		Iss:  jwtIssuer,
	}
	tok, err := s.sign(claims)
	if err != nil {
		return "", AccessClaims{}, err
	}
	return tok, claims, nil
}

func (s *JWTSigner) sign(claims AccessClaims) (string, error) {
	header := `{"alg":"EdDSA","typ":"JWT"}`
	body, err := json.Marshal(claims)
	if err != nil {
		return "", fmt.Errorf("marshal claims: %w", err)
	}
	enc := base64.RawURLEncoding
	signing := enc.EncodeToString([]byte(header)) + "." + enc.EncodeToString(body)
	sig := ed25519.Sign(s.priv, []byte(signing))
	return signing + "." + enc.EncodeToString(sig), nil
}

// Verify checks signature + expiry and returns the claims.
func (s *JWTSigner) Verify(token string) (AccessClaims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return AccessClaims{}, ErrTokenMalformed
	}
	enc := base64.RawURLEncoding
	sig, err := enc.DecodeString(parts[2])
	if err != nil {
		return AccessClaims{}, ErrTokenMalformed
	}
	if !ed25519.Verify(s.pub, []byte(parts[0]+"."+parts[1]), sig) {
		return AccessClaims{}, ErrTokenSignature
	}
	body, err := enc.DecodeString(parts[1])
	if err != nil {
		return AccessClaims{}, ErrTokenMalformed
	}
	var c AccessClaims
	if err := json.Unmarshal(body, &c); err != nil {
		return AccessClaims{}, ErrTokenMalformed
	}
	if time.Now().Unix() >= c.Exp {
		return c, ErrTokenExpired
	}
	return c, nil
}
