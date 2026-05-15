// Package server provides a shared HTTP server with graceful shutdown.
package server

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog"

	"github.com/vettguard/vettguard/services/shared/pkg/health"
	"github.com/vettguard/vettguard/services/shared/pkg/middleware"
)

type Server struct {
	Name    string
	Port    int
	Logger  zerolog.Logger
	Health  *health.Checker
	Router  *chi.Mux
}

// New constructs a chi router with the standard VettGuard middleware stack.
func New(name string, port int, log zerolog.Logger) *Server {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger(log))
	r.Use(middleware.Recover)
	r.Use(middleware.SecurityHeaders)

	hc := health.New()
	r.Get("/healthz", hc.HandleLive)
	r.Get("/readyz", hc.HandleReady)

	return &Server{Name: name, Port: port, Logger: log, Health: hc, Router: r}
}

// Run starts the HTTP server and blocks until SIGINT/SIGTERM.
func (s *Server) Run(ctx context.Context) error {
	addr := fmt.Sprintf(":%d", s.Port)
	httpSrv := &http.Server{
		Addr:              addr,
		Handler:           s.Router,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		s.Logger.Info().Str("addr", addr).Msg("listening")
		s.Health.MarkReady()
		if err := httpSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
		close(errCh)
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-sigCh:
		s.Logger.Info().Str("signal", sig.String()).Msg("shutting down")
	case err := <-errCh:
		if err != nil {
			return err
		}
	case <-ctx.Done():
		s.Logger.Info().Msg("context canceled, shutting down")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	return httpSrv.Shutdown(shutdownCtx)
}
