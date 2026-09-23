package auth

import (
	"crypto/rand"
	"encoding/base32"
	"fmt"

	"github.com/pquerna/otp/totp"
)

const totpIssuer = "VettGuard"

// TOTPSetup is the bundle handed to the dashboard during enrollment.
type TOTPSetup struct {
	Secret        string   // base32 secret (also encoded in OtpAuthURL)
	OtpAuthURL    string   // otpauth://totp/Issuer:account?secret=...&issuer=... — render as QR
	RecoveryCodes []string // 10× single-use 10-char codes
}

// GenerateTOTP creates a new secret + otpauth URL + recovery codes.
// account is typically the user email.
func GenerateTOTP(account string) (*TOTPSetup, error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      totpIssuer,
		AccountName: account,
	})
	if err != nil {
		return nil, fmt.Errorf("totp generate: %w", err)
	}
	codes, err := generateRecoveryCodes(10)
	if err != nil {
		return nil, err
	}
	return &TOTPSetup{
		Secret:        key.Secret(),
		OtpAuthURL:    key.URL(),
		RecoveryCodes: codes,
	}, nil
}

// ValidateTOTP returns true when code is a valid 6-digit code for secret
// (allowing the standard ±1 step skew).
func ValidateTOTP(secret, code string) bool {
	return totp.Validate(code, secret)
}

// generateRecoveryCodes returns n base32-derived 10-char codes.
// Format: AAAA-BBBB-CC (10 chars + 2 dashes), so 16 chars total.
func generateRecoveryCodes(n int) ([]string, error) {
	out := make([]string, n)
	buf := make([]byte, 7) // 7 bytes → 11 base32 chars; we take 10.
	enc := base32.StdEncoding.WithPadding(base32.NoPadding)
	for i := range n {
		if _, err := rand.Read(buf); err != nil {
			return nil, err
		}
		s := enc.EncodeToString(buf)[:10]
		out[i] = fmt.Sprintf("%s-%s-%s", s[:4], s[4:8], s[8:10])
	}
	return out, nil
}
