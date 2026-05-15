// gateway — VettGuard external HTTP/JSON edge.
//
// Responsibilities: JWT verify, rate limit, fan out gRPC to internal services,
// expose OpenAPI surface. Foundation phase: skeleton with shared middleware,
// /healthz, /readyz, /v1/health.
package main

import (
	"context"
	"encoding/json"
	"net/http"
	"os"

	"github.com/vettguard/vettguard/services/shared/pkg/config"
	"github.com/vettguard/vettguard/services/shared/pkg/logger"
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
	AIGatewayURL       string `envconfig:"AI_GATEWAY_URL"       default:"http://localhost:8090"`

	JWTSigningKey string `envconfig:"JWT_SIGNING_KEY" required:"true"`
	CORSOrigins   string `envconfig:"CORS_ORIGINS" default:"http://localhost:3000,http://localhost:3001"`
}

func main() {
	if err := os.Setenv("SERVICE_NAME", defaultName("gateway")); err != nil {
		panic(err)
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

	s := server.New(cfg.ServiceName, cfg.HTTPPort, log)

	s.Router.Get("/v1/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"service": cfg.ServiceName,
			"env":     cfg.Environment,
			"status":  "ok",
		})
	})

	if err := s.Run(ctx); err != nil {
		log.Fatal().Err(err).Msg("server stopped with error")
	}
}

func defaultName(fallback string) string {
	if v := os.Getenv("SERVICE_NAME"); v != "" {
		return v
	}
	return fallback
}
