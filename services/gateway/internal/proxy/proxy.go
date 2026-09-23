// Package proxy fans out Connect-RPC requests by URL prefix.
//
// Connect-RPC paths are deterministic: `/<package>.<Service>/<Method>`.
// We mount one reverse proxy per service at the package-qualified prefix
// so backend selection is O(1) router lookup, no path rewriting needed.
//
// mTLS: deferred to Sprint 3 — k3s NetworkPolicy + service mesh take the
// network-layer responsibility for now. When we open the cluster to
// untrusted networks, swap http.Transport for one that loads a client
// certificate from the Sealed-Secrets controller.
package proxy

import (
	"errors"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog"

	"github.com/vettguard/vettguard/services/shared/pkg/middleware"
	"github.com/vettguard/vettguard/services/shared/pkg/tenantctx"
)

// Backend names map proto service to upstream URL.
type Backends struct {
	Identity  string
	Billing   string
	Notifier  string
	Audit     string
	ELD       string
	Brokers   string // REST, not Connect — exposed at /v1/brokers/*
	Claims    string // REST, not Connect — exposed at /v1/claims/*
	AIGateway string // not a Connect service — exposed at /v1/ai/*
}

// Mount registers reverse proxies for each Connect-RPC service prefix on r.
// All routes added under this function expect to be wrapped in auth + rate
// limit upstream of the call.
func Mount(r chi.Router, b Backends, log zerolog.Logger) error {
	type route struct {
		path string
		url  string
	}
	routes := []route{
		{"/vettguard.v1.Identity/*", b.Identity},
		{"/vettguard.v1.Billing/*", b.Billing},
		{"/vettguard.v1.Notifier/*", b.Notifier},
		{"/vettguard.v1.Audit/*", b.Audit},
		{"/vettguard.v1.ELD/*", b.ELD},
		// Brokers is REST, not Connect — proxy /v1/brokers/* to it.
		{"/v1/brokers/*", b.Brokers},
		// Claims is REST, not Connect — proxy /v1/claims/* to it.
		{"/v1/claims/*", b.Claims},
		// AI gateway is REST, not Connect — proxy /v1/ai/* to it.
		{"/v1/ai/*", b.AIGateway},
	}
	for _, rt := range routes {
		if rt.url == "" {
			continue
		}
		u, err := url.Parse(rt.url)
		if err != nil {
			return errors.New("proxy: bad upstream URL: " + rt.url)
		}
		proxy := newReverseProxy(u, log)
		r.Handle(rt.path, proxy)
	}
	return nil
}

// MountPublic registers reverse proxies for the routes that bypass auth.
// Caller is responsible for placing this on a router group without
// RequireAuth (rate-limit-only).
//
// Includes both REST routes (waitlist signup/confirm, email-link verify,
// password reset) and the pre-tenant Identity Connect RPCs (sign-up,
// login, refresh, OAuth start/complete). The remaining Identity RPCs
// (RevokeSession, EnableTOTP, VerifyTOTP) stay on the auth-required
// wildcard `/vettguard.v1.Identity/*` mounted by Mount() — chi matches
// the more specific public paths first, so the wildcard is a fall-through
// for everything not enumerated below.
func MountPublic(r chi.Router, b Backends, log zerolog.Logger) error {
	if b.Identity == "" {
		return nil
	}
	u, err := url.Parse(b.Identity)
	if err != nil {
		return errors.New("proxy: bad upstream URL: " + b.Identity)
	}
	proxy := newReverseProxy(u, log)
	// REST (plain HTTP/JSON)
	r.Handle("/v1/landing/waitlist", proxy)
	r.Handle("/v1/landing/waitlist/confirm", proxy)
	r.Handle("/v1/auth/verify-email", proxy)
	r.Handle("/v1/auth/request-password-reset", proxy)
	r.Handle("/v1/auth/confirm-password-reset", proxy)
	// Identity Connect-RPC routes that MUST be reachable pre-login.
	r.Handle("/vettguard.v1.Identity/SignUpWithEmail", proxy)
	r.Handle("/vettguard.v1.Identity/LoginWithEmail", proxy)
	r.Handle("/vettguard.v1.Identity/RefreshSession", proxy)
	r.Handle("/vettguard.v1.Identity/StartOAuth", proxy)
	r.Handle("/vettguard.v1.Identity/CompleteOAuth", proxy)
	return nil
}

func newReverseProxy(target *url.URL, log zerolog.Logger) http.Handler {
	rp := httputil.NewSingleHostReverseProxy(target)

	originalDirector := rp.Director
	rp.Director = func(req *http.Request) {
		originalDirector(req)
		// Propagate identity context to the upstream. Internal services
		// trust these headers because they're only reachable via the
		// gateway (cluster NetworkPolicy denies direct ingress).
		if tc, err := tenantctx.From(req.Context()); err == nil {
			if tc.TenantID != [16]byte{} {
				req.Header.Set("X-Tenant-ID", tc.TenantID.String())
			}
			if tc.UserID != [16]byte{} {
				req.Header.Set("X-User-ID", tc.UserID.String())
			}
			if tc.Role != "" {
				req.Header.Set("X-User-Role", tc.Role)
			}
		}
		// Request ID is set on the response header by the RequestID middleware.
		if reqID := req.Header.Get(middleware.RequestIDHeader); reqID == "" {
			// Hopefully already set; fall through if not.
		}
	}

	rp.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		log.Warn().Err(err).Str("upstream", target.String()).Str("path", r.URL.Path).Msg("proxy: upstream error")
		http.Error(w, "upstream unavailable", http.StatusBadGateway)
	}
	return rp
}
