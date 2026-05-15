// Package middleware provides HTTP middleware shared across all VettGuard services.
package middleware

import (
	"context"
	"net/http"
	"runtime/debug"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/vettguard/vettguard/services/shared/pkg/logger"
)

const RequestIDHeader = "X-Request-ID"

type ctxKey struct{ name string }

var requestIDKey = ctxKey{"request-id"}

// RequestID assigns or propagates a request ID per request.
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get(RequestIDHeader)
		if id == "" {
			id = uuid.NewString()
		}
		w.Header().Set(RequestIDHeader, id)
		ctx := context.WithValue(r.Context(), requestIDKey, id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequestIDFromContext returns the request ID set by RequestID.
func RequestIDFromContext(ctx context.Context) string {
	if id, ok := ctx.Value(requestIDKey).(string); ok {
		return id
	}
	return ""
}

// Logger attaches a per-request logger to the context and logs the response.
func Logger(base zerolog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			id := RequestIDFromContext(r.Context())
			reqLog := base.With().Str("request_id", id).Logger()
			ctx := logger.WithContext(r.Context(), &reqLog)

			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
			defer func() {
				reqLog.Info().
					Str("method", r.Method).
					Str("path", r.URL.Path).
					Int("status", ww.Status()).
					Int("bytes", ww.BytesWritten()).
					Dur("dur", time.Since(start)).
					Msg("http")
			}()

			next.ServeHTTP(ww, r.WithContext(ctx))
		})
	}
}

// Recover catches panics, logs them, and returns 500.
func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log := logger.FromContext(r.Context())
				log.Error().
					Interface("panic", rec).
					Bytes("stack", debug.Stack()).
					Msg("recovered from panic")
				http.Error(w, `{"error":"internal"}`, http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// SecurityHeaders adds baseline security headers to every response.
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		h.Set("Permissions-Policy", "interest-cohort=()")
		// HSTS only meaningful behind TLS in prod; safe-to-set always.
		h.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		next.ServeHTTP(w, r)
	})
}
