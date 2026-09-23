// Package tenantctx threads tenant + user identity through context.Context.
//
// Every external request that reaches an internal service carries a tenant
// context (set by the gateway after JWT verification). The repo layer uses
// FromContext to bind `SET LOCAL app.tenant_id` on the DB transaction so
// Postgres RLS policies enforce isolation.
package tenantctx

import (
	"context"
	"errors"

	"github.com/google/uuid"
)

type ctxKey struct{}

var key = ctxKey{}

// Context carries the verified identity of the caller.
type Context struct {
	TenantID  uuid.UUID
	UserID    uuid.UUID // may be uuid.Nil for service-to-service calls
	Role      string    // owner | admin | dispatcher | viewer | "" for service
	RequestID string
}

var ErrMissing = errors.New("tenantctx: not present on context")

// With attaches a tenant context. Returns a new context — never mutates input.
func With(parent context.Context, tc Context) context.Context {
	return context.WithValue(parent, key, tc)
}

// From retrieves the tenant context, or ErrMissing.
func From(ctx context.Context) (Context, error) {
	tc, ok := ctx.Value(key).(Context)
	if !ok {
		return Context{}, ErrMissing
	}
	return tc, nil
}

// MustFrom panics when called outside an authenticated request. Use only in
// code paths where tenantctx is guaranteed (e.g., after RequireAuth middleware).
func MustFrom(ctx context.Context) Context {
	tc, err := From(ctx)
	if err != nil {
		panic(err)
	}
	return tc
}
