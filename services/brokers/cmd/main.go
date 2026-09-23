// brokers — vetted brokers per tenant (read/write). Pre-tenant global
// broker database is a Sprint 5 separate concern.
package main

import (
	"context"
	"encoding/json"
	"net/http"
	"os"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"

	"github.com/vettguard/vettguard/services/brokers/internal/handler"
	"github.com/vettguard/vettguard/services/shared/pkg/config"
	"github.com/vettguard/vettguard/services/shared/pkg/logger"
	"github.com/vettguard/vettguard/services/shared/pkg/server"
	"github.com/vettguard/vettguard/services/shared/pkg/tenantctx"
	"github.com/vettguard/vettguard/services/shared/pkg/tracing"
)

type Config struct {
	config.Base
	DatabaseURL string `envconfig:"DATABASE_URL" required:"true"`
}

func main() {
	if v := os.Getenv("SERVICE_NAME"); v == "" {
		_ = os.Setenv("SERVICE_NAME", "brokers")
	}

	var cfg Config
	if err := config.Load("", &cfg); err != nil {
		panic(err)
	}
	if cfg.HTTPPort == 8080 {
		cfg.HTTPPort = 8086
	}

	log := logger.New(cfg.ServiceName, cfg.Environment, cfg.LogLevel)
	ctx := context.Background()

	shutdownTrace, err := tracing.Setup(ctx, cfg.ServiceName, cfg.Environment, cfg.OTELEndpoint)
	if err != nil {
		log.Fatal().Err(err).Msg("tracing setup failed")
	}
	defer func() { _ = shutdownTrace(context.Background()) }()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("pgxpool connect failed")
	}
	defer pool.Close()

	s := server.New(cfg.ServiceName, cfg.HTTPPort, log)

	s.Router.Get("/v1/brokers/info", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"service": "brokers", "status": "ok"})
	})

	// All /v1/brokers/* read/write endpoints need a tenant context. The
	// gateway terminates JWT verification and forwards X-Tenant-ID +
	// X-User-ID + X-User-Role headers; we populate tenantctx from those.
	// Service is only reachable via the gateway (cluster NetworkPolicy),
	// so trusting forwarded headers is safe.
	authed := s.Router.Group(nil)
	authed.Use(tenantHeaderMiddleware(log))

	h := &handler.Brokers{Pool: pool, Log: log}
	h.Mount(authed)

	if err := s.Run(ctx); err != nil {
		log.Fatal().Err(err).Msg("server stopped with error")
	}
}

// tenantHeaderMiddleware reads X-Tenant-ID / X-User-ID / X-User-Role
// from the request (set by gateway proxy.Director) and pushes them into
// tenantctx. Missing tenant → 401 (auth failed upstream).
func tenantHeaderMiddleware(log zerolog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tid, err := uuid.Parse(r.Header.Get("X-Tenant-ID"))
			if err != nil {
				http.Error(w, "missing or invalid X-Tenant-ID", http.StatusUnauthorized)
				return
			}
			uid, _ := uuid.Parse(r.Header.Get("X-User-ID"))
			role := r.Header.Get("X-User-Role")
			ctx := tenantctx.With(r.Context(), tenantctx.Context{
				TenantID: tid, UserID: uid, Role: role,
			})
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
