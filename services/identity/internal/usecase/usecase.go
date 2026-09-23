// Package usecase implements the identity service business logic.
//
// Each handler is a small composable function that orchestrates the db
// queries (sqlc-generated) + auth primitives + outbound effects (email).
// HTTP/Connect handlers live in internal/handler and call these.
package usecase

import (
	"context"
	"errors"
	"net/url"
)

// Notifier abstracts the notifier service (transactional email).
// In production this is implemented by an RPC client; tests use a stub.
type Notifier interface {
	SendVerificationEmail(ctx context.Context, to, fullName, verifyURL string) error
	SendPasswordResetEmail(ctx context.Context, to, fullName, resetURL string) error
	// Generic template send — used by surfaces that don't fit the named
	// transactional templates above (e.g. marketing.waitlist_confirm).
	Send(ctx context.Context, args NotifyArgs) error
}

// NotifyArgs is the generic notifier payload for templates that aren't
// named transactional auth flows.
type NotifyArgs struct {
	Template string
	To       string
	Vars     map[string]string
}

// URLBuilder produces customer-facing links (dashboard verify/reset endpoints,
// landing-page waitlist confirm).
type URLBuilder interface {
	VerifyEmailURL(token string) string
	PasswordResetURL(token string) string
	WaitlistConfirmURL(token string) string
}

// SimpleURLBuilder builds links against a base dashboard URL.
type SimpleURLBuilder struct {
	DashboardBaseURL string // e.g., "https://app.vettguard.com"
}

func (b SimpleURLBuilder) VerifyEmailURL(token string) string {
	u, _ := url.Parse(b.DashboardBaseURL)
	u.Path = "/verify-email"
	q := u.Query()
	q.Set("token", token)
	u.RawQuery = q.Encode()
	return u.String()
}

func (b SimpleURLBuilder) PasswordResetURL(token string) string {
	u, _ := url.Parse(b.DashboardBaseURL)
	u.Path = "/reset-password"
	q := u.Query()
	q.Set("token", token)
	u.RawQuery = q.Encode()
	return u.String()
}

// WaitlistConfirmURL points at the landing site (not the dashboard) since
// that's where the marketing-site form was submitted from. The link goes
// through the gateway's /v1/landing/waitlist/confirm endpoint which renders
// a tiny confirmation page.
func (b SimpleURLBuilder) WaitlistConfirmURL(token string) string {
	u, _ := url.Parse(b.DashboardBaseURL)
	// Confirmation lands on the gateway-fronted URL — keep it simple and
	// point straight at the API; the gateway can redirect to a landing
	// success page after marking the row confirmed.
	u.Path = "/v1/landing/waitlist/confirm"
	q := u.Query()
	q.Set("token", token)
	u.RawQuery = q.Encode()
	return u.String()
}

// Domain-level errors. Map to HTTP / Connect codes at the handler layer.
var (
	ErrEmailTaken       = errors.New("usecase: email already in use")
	ErrUnknownUser      = errors.New("usecase: user not found")
	ErrBadCredentials   = errors.New("usecase: invalid email or password")
	ErrAccountLocked    = errors.New("usecase: account temporarily locked")
	ErrEmailNotVerified = errors.New("usecase: email not verified")
	ErrTokenInvalid     = errors.New("usecase: token invalid or expired")
)
