package middleware

import (
	"net/http"

	"github.com/vettguard/vettguard/services/shared/pkg/tenantctx"
)

// Role constants — kept as strings for cheap proto/db interop. The proto
// enum values (Role_ROLE_OWNER, ...) lowercase-stringify to these.
const (
	RoleOwner      = "owner"
	RoleAdmin      = "admin"
	RoleDispatcher = "dispatcher"
	RoleViewer     = "viewer"
)

// RequireRole returns a middleware that lets the request through only when
// the caller's tenantctx role is in allowed. Place AFTER RequireAuth.
// 401 when no tenantctx (auth missing); 403 when role isn't permitted.
func RequireRole(allowed ...string) func(http.Handler) http.Handler {
	set := make(map[string]struct{}, len(allowed))
	for _, r := range allowed {
		set[r] = struct{}{}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tc, err := tenantctx.From(r.Context())
			if err != nil {
				http.Error(w, "unauthenticated", http.StatusUnauthorized)
				return
			}
			if _, ok := set[tc.Role]; !ok {
				http.Error(w, "forbidden", http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
