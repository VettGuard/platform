package auth

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
)

// AEAD wraps an AES-256-GCM cipher with a single key. Used to encrypt
// per-user TOTP secrets at rest in `mfa_factors.secret_encrypted`. Rotate
// the key by re-encrypting all rows in a migration (no graceful versioning
// yet — KISS until we actually have customers).
type AEAD struct {
	gcm cipher.AEAD
}

var ErrAEADKey = errors.New("auth: encryption key must be 32 bytes (base64)")

// NewAEAD accepts a base64-encoded 32-byte key (e.g. `openssl rand -base64 32`).
func NewAEAD(b64Key string) (*AEAD, error) {
	raw, err := base64.StdEncoding.DecodeString(strings.TrimSpace(b64Key))
	if err != nil {
		return nil, fmt.Errorf("decode encryption key: %w", err)
	}
	if len(raw) != 32 {
		return nil, ErrAEADKey
	}
	block, err := aes.NewCipher(raw)
	if err != nil {
		return nil, fmt.Errorf("aes cipher: %w", err)
	}
	g, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("gcm: %w", err)
	}
	return &AEAD{gcm: g}, nil
}

// Seal returns nonce || ciphertext.
func (a *AEAD) Seal(plain []byte) ([]byte, error) {
	nonce := make([]byte, a.gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}
	return a.gcm.Seal(nonce, nonce, plain, nil), nil
}

// Open reverses Seal.
func (a *AEAD) Open(blob []byte) ([]byte, error) {
	ns := a.gcm.NonceSize()
	if len(blob) < ns {
		return nil, errors.New("auth: ciphertext too short")
	}
	return a.gcm.Open(nil, blob[:ns], blob[ns:], nil)
}
