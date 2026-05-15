// notifier — Postmark email + Twilio SMS + in-app notifications.
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

	PostmarkServerToken string `envconfig:"POSTMARK_SERVER_TOKEN"`
	PostmarkFromAddress string `envconfig:"POSTMARK_FROM_ADDRESS" default:"noreply@vettguard.com"`
	TwilioAccountSID    string `envconfig:"TWILIO_ACCOUNT_SID"`
	TwilioAuthToken     string `envconfig:"TWILIO_AUTH_TOKEN"`
}

func main() {
	if v := os.Getenv("SERVICE_NAME"); v == "" {
		_ = os.Setenv("SERVICE_NAME", "notifier")
	}

	var cfg Config
	if err := config.Load("", &cfg); err != nil {
		panic(err)
	}
	if cfg.HTTPPort == 8080 {
		cfg.HTTPPort = 8083
	}

	log := logger.New(cfg.ServiceName, cfg.Environment, cfg.LogLevel)
	ctx := context.Background()

	shutdownTrace, err := tracing.Setup(ctx, cfg.ServiceName, cfg.Environment, cfg.OTELEndpoint)
	if err != nil {
		log.Fatal().Err(err).Msg("tracing setup failed")
	}
	defer func() { _ = shutdownTrace(context.Background()) }()

	s := server.New(cfg.ServiceName, cfg.HTTPPort, log)

	s.Router.Get("/v1/notifier/info", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"service": "notifier", "status": "ok"})
	})

	if err := s.Run(ctx); err != nil {
		log.Fatal().Err(err).Msg("server stopped with error")
	}
}
