// billing — Stripe subscriptions, success-fee invoices, customer portal, webhooks.
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

	StripeSecretKey      string `envconfig:"STRIPE_SECRET_KEY" required:"true"`
	StripeWebhookSecret  string `envconfig:"STRIPE_WEBHOOK_SECRET" required:"true"`
	StripeVettingPriceID string `envconfig:"STRIPE_VETTING_PRICE_ID"`
}

func main() {
	if v := os.Getenv("SERVICE_NAME"); v == "" {
		_ = os.Setenv("SERVICE_NAME", "billing")
	}

	var cfg Config
	if err := config.Load("", &cfg); err != nil {
		panic(err)
	}
	if cfg.HTTPPort == 8080 {
		cfg.HTTPPort = 8082
	}

	log := logger.New(cfg.ServiceName, cfg.Environment, cfg.LogLevel)
	ctx := context.Background()

	shutdownTrace, err := tracing.Setup(ctx, cfg.ServiceName, cfg.Environment, cfg.OTELEndpoint)
	if err != nil {
		log.Fatal().Err(err).Msg("tracing setup failed")
	}
	defer func() { _ = shutdownTrace(context.Background()) }()

	s := server.New(cfg.ServiceName, cfg.HTTPPort, log)

	s.Router.Get("/v1/billing/info", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"service": "billing", "status": "ok"})
	})

	if err := s.Run(ctx); err != nil {
		log.Fatal().Err(err).Msg("server stopped with error")
	}
}
