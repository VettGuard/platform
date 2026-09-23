package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"

	"github.com/vettguard/vettguard/services/shared/pkg/tenantctx"
)

func TestRequireRole(t *testing.T) {
	pass := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(200) })

	tests := []struct {
		name    string
		ctx     *tenantctx.Context
		allowed []string
		want    int
	}{
		{"no ctx", nil, []string{RoleOwner}, http.StatusUnauthorized},
		{"role allowed", &tenantctx.Context{TenantID: uuid.New(), UserID: uuid.New(), Role: RoleOwner}, []string{RoleOwner, RoleAdmin}, 200},
		{"role denied", &tenantctx.Context{TenantID: uuid.New(), UserID: uuid.New(), Role: RoleViewer}, []string{RoleOwner}, http.StatusForbidden},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			h := RequireRole(tc.allowed...)(pass)
			req := httptest.NewRequest("GET", "/", nil)
			if tc.ctx != nil {
				req = req.WithContext(tenantctx.With(req.Context(), *tc.ctx))
			}
			rr := httptest.NewRecorder()
			h.ServeHTTP(rr, req)
			if rr.Code != tc.want {
				t.Fatalf("status: want %d got %d", tc.want, rr.Code)
			}
		})
	}
}
