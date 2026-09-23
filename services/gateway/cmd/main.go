// gateway — VettGuard external HTTP/JSON edge.
//
// Responsibilities:
//   - JWT verify (Ed25519) + tenantctx population for downstream services
//   - CORS for the apps/* domains
//   - Per-tenant + per-IP rate limit (Redis token bucket)
//   - Connect-RPC fan-out by service-prefix to identity / billing / notifier / audit
//   - REST fan-out for /v1/ai/* to the Python ai-gateway
//   - OpenAPI 3.1 at /openapi.json
package main

import (
	"context"
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/cors"

	"github.com/vettguard/vettguard/services/gateway/internal/openapi"
	"github.com/vettguard/vettguard/services/gateway/internal/proxy"
	"github.com/vettguard/vettguard/services/gateway/internal/ratelimit"
	"github.com/vettguard/vettguard/services/shared/pkg/config"
	"github.com/vettguard/vettguard/services/shared/pkg/logger"
	"github.com/vettguard/vettguard/services/shared/pkg/middleware"
	"github.com/vettguard/vettguard/services/shared/pkg/server"
	"github.com/vettguard/vettguard/services/shared/pkg/tracing"
)

type Config struct {
	config.Base

	IdentityServiceURL string `envconfig:"IDENTITY_SERVICE_URL" default:"http://localhost:8081"`
	BillingServiceURL  string `envconfig:"BILLING_SERVICE_URL"  default:"http://localhost:8082"`
	NotifierServiceURL string `envconfig:"NOTIFIER_SERVICE_URL" default:"http://localhost:8083"`
	AuditServiceURL    string `envconfig:"AUDIT_SERVICE_URL"    default:"http://localhost:8084"`
	ELDServiceURL      string `envconfig:"ELD_SERVICE_URL"      default:"http://localhost:8085"`
	BrokersServiceURL  string `envconfig:"BROKERS_SERVICE_URL"  default:"http://localhost:8086"`
	ClaimsServiceURL   string `envconfig:"CLAIMS_SERVICE_URL"   default:"http://localhost:8087"`
	AIGatewayURL       string `envconfig:"AI_GATEWAY_URL"       default:"http://localhost:8090"`

	// Same key the identity service signs with; we derive the Ed25519 public
	// key here for verify-only use. JWKS rotation is a Sprint 3 add.
	JWTSigningKey string `envconfig:"JWT_SIGNING_KEY" required:"true"`
	CORSOrigins   string `envconfig:"CORS_ORIGINS" default:"http://localhost:3000,http://localhost:3001"`

	RedisAddr     string `envconfig:"REDIS_ADDR"     default:"localhost:6379"`
	RedisPassword string `envconfig:"REDIS_PASSWORD" default:""`
}

func main() {
	if v := os.Getenv("SERVICE_NAME"); v == "" {
		_ = os.Setenv("SERVICE_NAME", "gateway")
	}
	var cfg Config
	if err := config.Load("", &cfg); err != nil {
		panic(err)
	}

	log := logger.New(cfg.ServiceName, cfg.Environment, cfg.LogLevel)
	ctx := context.Background()

	shutdownTrace, err := tracing.Setup(ctx, cfg.ServiceName, cfg.Environment, cfg.OTELEndpoint)
	if err != nil {
		log.Fatal().Err(err).Msg("tracing setup failed")
	}
	defer func() { _ = shutdownTrace(context.Background()) }()

	pub, err := derivePublicKey(cfg.JWTSigningKey)
	if err != nil {
		log.Fatal().Err(err).Msg("derive jwt public key")
	}

	redisClient, err := ratelimit.MustConnect(cfg.RedisAddr, cfg.RedisPassword)
	if err != nil {
		// In dev without Redis we degrade to fail-open per-IP limiter. Log and continue.
		log.Warn().Err(err).Msg("redis unavailable; rate limit disabled")
	}
	limiter := ratelimit.New(redisClient, log)

	s := server.New(cfg.ServiceName, cfg.HTTPPort, log)

	// CORS for the dashboard / landing / admin / extension popup origins.
	s.Router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   splitCSV(cfg.CORSOrigins),
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "X-Request-ID", "Connect-Protocol-Version"},
		ExposedHeaders:   []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Public endpoints — no auth, no rate limit beyond CORS.
	s.Router.Get("/v1/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"service": cfg.ServiceName,
			"env":     cfg.Environment,
			"status":  "ok",
		})
	})
	s.Router.Get("/openapi.json", openapi.Handler())

	// Unauthenticated auth-start endpoints (signup, oauth/start, login,
	// password reset request) need rate limiting but not auth. Mount them
	// behind the IP-only limiter — the same limiter, just without tenant
	// context, which the middleware handles transparently.
	publicAPI := s.Router.Group(nil)
	publicAPI.Use(limiter.Middleware)
	// Public REST endpoints fronted by identity (waitlist signup/confirm,
	// email-link verify, password reset). No auth — these run pre-tenant.
	if err := proxy.MountPublic(publicAPI, proxy.Backends{Identity: cfg.IdentityServiceURL}, log); err != nil {
		log.Fatal().Err(err).Msg("public proxy mount failed")
	}

	// Authenticated routes: require Bearer JWT, populate tenantctx, then
	// rate-limit, then fan out.
	authAPI := s.Router.Group(nil)
	authAPI.Use(middleware.RequireAuth(pub))
	authAPI.Use(limiter.Middleware)

	// Fan-out for Connect-RPC services + REST AI gateway. Mounted on both
	// groups: public for SignUp/Login + auth for everything else. The
	// reverse-proxy doesn't care which group it sits under; auth enforcement
	// is upstream.
	backends := proxy.Backends{
		Identity:  cfg.IdentityServiceURL,
		Billing:   cfg.BillingServiceURL,
		Notifier:  cfg.NotifierServiceURL,
		Audit:     cfg.AuditServiceURL,
		ELD:       cfg.ELDServiceURL,
		Brokers:   cfg.BrokersServiceURL,
		Claims:    cfg.ClaimsServiceURL,
		AIGateway: cfg.AIGatewayURL,
	}
	if err := proxy.Mount(authAPI, backends, log); err != nil {
		log.Fatal().Err(err).Msg("proxy mount failed")
	}

	if err := s.Run(ctx); err != nil {
		log.Fatal().Err(err).Msg("server stopped with error")
	}
}

// derivePublicKey accepts a base64-encoded Ed25519 seed (32 bytes) or full
// private key (64 bytes) — same format the identity service consumes — and
// returns the matching public key.
func derivePublicKey(b64Key string) (ed25519.PublicKey, error) {
	raw, err := base64.StdEncoding.DecodeString(strings.TrimSpace(b64Key))
	if err != nil {
		return nil, err
	}
	var priv ed25519.PrivateKey
	switch len(raw) {
	case ed25519.SeedSize:
		priv = ed25519.NewKeyFromSeed(raw)
	case ed25519.PrivateKeySize:
		priv = ed25519.PrivateKey(raw)
	default:
		return nil, errEdSize
	}
	return priv.Public().(ed25519.PublicKey), nil
}

var errEdSize = jwtKeyError("JWT_SIGNING_KEY must decode to 32 or 64 bytes")

type jwtKeyError string

func (e jwtKeyError) Error() string { return string(e) }

func splitCSV(s string) []string {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	return out
}
