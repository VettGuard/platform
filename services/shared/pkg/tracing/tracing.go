// Package tracing wires OpenTelemetry tracing with an OTLP/gRPC exporter.
package tracing

import (
	"context"
	"fmt"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	"go.opentelemetry.io/otel/trace"
)

// Setup configures a global tracer provider.
// If endpoint is empty, returns a no-op shutdown and the no-op tracer remains active.
func Setup(ctx context.Context, serviceName, environment, endpoint string) (func(context.Context) error, error) {
	if endpoint == "" {
		return func(context.Context) error { return nil }, nil
	}

	exp, err := otlptracegrpc.New(ctx,
		otlptracegrpc.WithEndpoint(endpoint),
		otlptracegrpc.WithInsecure(),
	)
	if err != nil {
		return nil, fmt.Errorf("otlp exporter: %w", err)
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(serviceName),
			semconv.DeploymentEnvironmentKey.String(environment),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("otel resource: %w", err)
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exp),
		sdktrace.WithResource(res),
		sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(0.2))),
	)
	otel.SetTracerProvider(tp)

	return tp.Shutdown, nil
}

func Tracer(name string) trace.Tracer { return otel.Tracer(name) }
