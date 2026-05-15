// Package config loads service configuration from environment variables.
package config

import (
	"fmt"

	"github.com/kelseyhightower/envconfig"
)

type Base struct {
	ServiceName string `envconfig:"SERVICE_NAME" required:"true"`
	Environment string `envconfig:"ENVIRONMENT" default:"development"`
	HTTPPort    int    `envconfig:"HTTP_PORT" default:"8080"`
	LogLevel    string `envconfig:"LOG_LEVEL" default:"info"`

	OTELEndpoint string `envconfig:"OTEL_EXPORTER_OTLP_ENDPOINT"`

	DatabaseURL string `envconfig:"DATABASE_URL"`
	RedisURL    string `envconfig:"REDIS_URL"`
	NATSURL     string `envconfig:"NATS_URL"`
}

// Load reads env vars (.env merged by caller) into the given config struct.
// Pass a pointer to a struct that embeds Base or uses envconfig tags directly.
func Load(prefix string, target interface{}) error {
	if err := envconfig.Process(prefix, target); err != nil {
		return fmt.Errorf("envconfig: %w", err)
	}
	return nil
}
