// notifier — transactional email (Postmark) + SMS (Twilio later) + webhooks.
package main

import (
	"context"
	"encoding/json"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vettguard/vettguard/packages/proto/gen/go/protov1connect"
	"github.com/vettguard/vettguard/services/notifier/internal/handler"
	"github.com/vettguard/vettguard/services/notifier/internal/postmark"
	"github.com/vettguard/vettguard/services/shared/pkg/config"
	"github.com/vettguard/vettguard/services/shared/pkg/logger"
	"github.com/vettguard/vettguard/services/shared/pkg/server"
	"github.com/vettguard/vettguard/services/shared/pkg/tracing"
)

type Config struct {
	config.Base

	DatabaseURL         string `envconfig:"DATABASE_URL" required:"true"`
	PostmarkServerToken string `envconfig:"POSTMARK_SERVER_TOKEN" required:"true"`
	PostmarkFromAddress string `envconfig:"POSTMARK_FROM_ADDRESS" default:"VettGuard <noreply@vettguard.com>"`
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

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("pgxpool connect failed")
	}
	defer pool.Close()

	pm := postmark.New(cfg.PostmarkServerToken, cfg.PostmarkFromAddress)
	notifierHandler := &handler.Notifier{Pool: pool, Postmark: pm, Log: log}

	s := server.New(cfg.ServiceName, cfg.HTTPPort, log)
	path, h := protov1connect.NewNotifierHandler(notifierHandler)
	s.Router.Mount(path, h)
	s.Router.Post("/v1/notifier/postmark/webhook", notifierHandler.PostmarkWebhookHTTP)

	s.Router.Get("/v1/notifier/info", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"service": "notifier", "status": "ok"})
	})

	if err := s.Run(ctx); err != nil {
		log.Fatal().Err(err).Msg("server stopped with error")
	}
}
