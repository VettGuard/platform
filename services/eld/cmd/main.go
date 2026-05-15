// eld — Motive + Samsara OAuth + webhook receivers + dwell event publisher.
// Foundation phase: token exchange only; full dwell logic lands in Phase 2.
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

	MotiveClientID     string `envconfig:"MOTIVE_CLIENT_ID"`
	MotiveClientSecret string `envconfig:"MOTIVE_CLIENT_SECRET"`
	SamsaraClientID    string `envconfig:"SAMSARA_CLIENT_ID"`
	SamsaraClientSec   string `envconfig:"SAMSARA_CLIENT_SECRET"`
	WebhookHMACSecret  string `envconfig:"ELD_WEBHOOK_HMAC_SECRET"`
}

func main() {
	if v := os.Getenv("SERVICE_NAME"); v == "" {
		_ = os.Setenv("SERVICE_NAME", "eld")
	}

	var cfg Config
	if err := config.Load("", &cfg); err != nil {
		panic(err)
	}
	if cfg.HTTPPort == 8080 {
		cfg.HTTPPort = 8085
	}

	log := logger.New(cfg.ServiceName, cfg.Environment, cfg.LogLevel)
	ctx := context.Background()

	shutdownTrace, err := tracing.Setup(ctx, cfg.ServiceName, cfg.Environment, cfg.OTELEndpoint)
	if err != nil {
		log.Fatal().Err(err).Msg("tracing setup failed")
	}
	defer func() { _ = shutdownTrace(context.Background()) }()

	s := server.New(cfg.ServiceName, cfg.HTTPPort, log)

	s.Router.Get("/v1/eld/info", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"service": "eld", "status": "ok"})
	})

	if err := s.Run(ctx); err != nil {
		log.Fatal().Err(err).Msg("server stopped with error")
	}
}
