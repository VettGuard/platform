// Package logger configures zerolog for structured JSON logging.
package logger

import (
	"context"
	"os"
	"time"

	"github.com/rs/zerolog"
)

type ctxKey struct{}

var loggerCtxKey = ctxKey{}

// New returns a zerolog logger configured for the given service.
// In development, output is human-readable; in production, structured JSON.
func New(serviceName, environment, level string) zerolog.Logger {
	zerolog.TimeFieldFormat = time.RFC3339Nano
	lvl, err := zerolog.ParseLevel(level)
	if err != nil {
		lvl = zerolog.InfoLevel
	}

	var w = os.Stdout
	var base zerolog.Logger
	if environment == "development" {
		base = zerolog.New(zerolog.ConsoleWriter{Out: w, TimeFormat: time.RFC3339}).
			Level(lvl).With().Timestamp().Logger()
	} else {
		base = zerolog.New(w).Level(lvl).With().Timestamp().Logger()
	}

	return base.With().
		Str("service", serviceName).
		Str("env", environment).
		Logger()
}

// FromContext returns the logger attached to ctx, or a no-op logger.
func FromContext(ctx context.Context) *zerolog.Logger {
	if l, ok := ctx.Value(loggerCtxKey).(*zerolog.Logger); ok {
		return l
	}
	nop := zerolog.Nop()
	return &nop
}

func WithContext(ctx context.Context, l *zerolog.Logger) context.Context {
	return context.WithValue(ctx, loggerCtxKey, l)
}
