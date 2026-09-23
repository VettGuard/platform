// identity — tenants, users, sessions, OAuth (Google + Microsoft), TOTP 2FA.
package main

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vettguard/vettguard/packages/proto/gen/go/protov1connect"
	"github.com/vettguard/vettguard/services/identity/internal/auth"
	"github.com/vettguard/vettguard/services/identity/internal/handler"
	"github.com/vettguard/vettguard/services/identity/internal/oauth"
	"github.com/vettguard/vettguard/services/identity/internal/usecase"
	"github.com/vettguard/vettguard/services/shared/pkg/config"
	"github.com/vettguard/vettguard/services/shared/pkg/logger"
	"github.com/vettguard/vettguard/services/shared/pkg/server"
	"github.com/vettguard/vettguard/services/shared/pkg/tracing"
)

type Config struct {
	config.Base

	DatabaseURL        string `envconfig:"DATABASE_URL" required:"true"`
	DashboardBaseURL   string `envconfig:"DASHBOARD_BASE_URL" default:"http://localhost:3000"`
	OAuthRedirectURL   string `envconfig:"OAUTH_REDIRECT_URL" default:"http://localhost:3000/oauth/callback"`
	GoogleClientID     string `envconfig:"GOOGLE_OAUTH_CLIENT_ID"`
	GoogleClientSecret string `envconfig:"GOOGLE_OAUTH_CLIENT_SECRET"`
	MicrosoftClientID  string `envconfig:"MICROSOFT_OAUTH_CLIENT_ID"`
	MicrosoftClientSec string `envconfig:"MICROSOFT_OAUTH_CLIENT_SECRET"`
	JWTSigningKey      string `envconfig:"JWT_SIGNING_KEY" required:"true"`
	EncryptionKey      string `envconfig:"ENCRYPTION_KEY" required:"true"`
}

// logNotifier is a stand-in until services/notifier exposes a real client.
// Logs the verify/reset URL — useful in dev (Mailpit grabs nothing in this path yet).
type logNotifier struct{ log func(format string, args ...any) }

func (n logNotifier) SendVerificationEmail(_ context.Context, to, _, url string) error {
	n.log("notifier(stub): verify email to=%s url=%s", to, url)
	return nil
}
func (n logNotifier) SendPasswordResetEmail(_ context.Context, to, _, url string) error {
	n.log("notifier(stub): password reset to=%s url=%s", to, url)
	return nil
}
func (n logNotifier) Send(_ context.Context, args usecase.NotifyArgs) error {
	n.log("notifier(stub): template=%s to=%s vars=%v", args.Template, args.To, args.Vars)
	return nil
}

func main() {
	if v := os.Getenv("SERVICE_NAME"); v == "" {
		_ = os.Setenv("SERVICE_NAME", "identity")
	}

	var cfg Config
	if err := config.Load("", &cfg); err != nil {
		panic(err)
	}
	if cfg.HTTPPort == 8080 {
		cfg.HTTPPort = 8081
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

	signer, err := auth.NewJWTSigner(cfg.JWTSigningKey)
	if err != nil {
		log.Fatal().Err(err).Msg("jwt signer init failed")
	}
	aead, err := auth.NewAEAD(cfg.EncryptionKey)
	if err != nil {
		log.Fatal().Err(err).Msg("aead init failed")
	}

	identityHandler := &handler.Identity{
		Pool:      pool,
		Signer:    signer,
		AEAD:      aead,
		URLs:      usecase.SimpleURLBuilder{DashboardBaseURL: cfg.DashboardBaseURL},
		Notifier:  logNotifier{log: func(f string, a ...any) { log.Info().Msgf(f, a...) }},
		LoginRate: auth.NewIPRateLimiter(5, time.Minute),
		OAuth: oauth.NewConfig(
			cfg.GoogleClientID, cfg.GoogleClientSecret,
			cfg.MicrosoftClientID, cfg.MicrosoftClientSec,
			cfg.OAuthRedirectURL,
		),
		OAuthState: oauth.NewStateStore(10 * time.Minute),
	}

	s := server.New(cfg.ServiceName, cfg.HTTPPort, log)

	path, h := protov1connect.NewIdentityHandler(identityHandler)
	s.Router.Mount(path, h)

	s.Router.Get("/v1/identity/info", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"service": "identity", "status": "ok"})
	})

	// Plain HTTP endpoints for email-link flows. They aren't natural Connect
	// RPCs because the token always travels in a URL the user clicks, so we
	// keep them as JSON-over-HTTP and the dashboard proxies them through its
	// own /api/auth routes (cookies live there, not here).
	s.Router.Post("/v1/auth/verify-email", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Token string `json:"token"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Token == "" {
			httpErr(w, http.StatusBadRequest, "token required")
			return
		}
		if err := usecase.VerifyEmail(r.Context(), pool, body.Token); err != nil {
			if err == usecase.ErrTokenInvalid {
				httpErr(w, http.StatusUnauthorized, "token invalid or expired")
				return
			}
			log.Error().Err(err).Msg("verify email")
			httpErr(w, http.StatusInternalServerError, "verify failed")
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]bool{"ok": true})
	})

	s.Router.Post("/v1/auth/request-password-reset", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Email string `json:"email"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Email == "" {
			httpErr(w, http.StatusBadRequest, "email required")
			return
		}
		// Anti-enumeration: never reveal whether the email exists.
		if err := usecase.RequestPasswordReset(
			r.Context(), pool,
			usecase.SimpleURLBuilder{DashboardBaseURL: cfg.DashboardBaseURL},
			identityHandler.Notifier,
			body.Email,
		); err != nil {
			log.Warn().Err(err).Msg("request password reset (non-fatal)")
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]bool{"ok": true})
	})

	// Marketing waitlist — pre-tenant, pre-auth signups from the landing site.
	// Stored in marketing.waitlist_signups (separate schema, no RLS). Double-
	// opt-in: POST creates a `pending` row + emails a confirm link; the link
	// hits the GET endpoint below which flips status to `confirmed`.
	s.Router.Post("/v1/landing/waitlist", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Email  string `json:"email"`
			Role   string `json:"role"`
			Locale string `json:"locale"`
			Source string `json:"source"`
			IP     string `json:"ip"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Email == "" {
			httpErr(w, http.StatusBadRequest, "email required")
			return
		}
		ip := body.IP
		if ip == "" {
			// Fall back to forwarded headers / RemoteAddr.
			if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
				if i := strings.IndexByte(xff, ','); i > 0 {
					ip = strings.TrimSpace(xff[:i])
				} else {
					ip = strings.TrimSpace(xff)
				}
			}
		}
		if err := usecase.RegisterWaitlistSignup(r.Context(), pool,
			usecase.SimpleURLBuilder{DashboardBaseURL: cfg.DashboardBaseURL},
			identityHandler.Notifier,
			usecase.WaitlistSignupInput{
				Email:     body.Email,
				Role:      body.Role,
				Locale:    body.Locale,
				Source:    body.Source,
				IP:        ip,
				UserAgent: r.Header.Get("User-Agent"),
			},
		); err != nil {
			log.Warn().Err(err).Str("email", body.Email).Msg("waitlist register (non-fatal)")
		}
		// Always 200 — same anti-enumeration discipline as password reset.
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]bool{"ok": true})
	})

	s.Router.Get("/v1/landing/waitlist/confirm", func(w http.ResponseWriter, r *http.Request) {
		token := r.URL.Query().Get("token")
		if token == "" {
			httpErr(w, http.StatusBadRequest, "token required")
			return
		}
		if err := usecase.ConfirmWaitlistSignup(r.Context(), pool, token); err != nil {
			if err == usecase.ErrTokenInvalid {
				httpErr(w, http.StatusUnauthorized, "link invalid or expired")
				return
			}
			log.Error().Err(err).Msg("waitlist confirm")
			httpErr(w, http.StatusInternalServerError, "confirm failed")
			return
		}
		// Minimal HTML success page — landing team can swap with a richer
		// react route in a follow-up.
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(`<!doctype html><meta charset="utf-8"><title>You're on the list — VettGuard</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif;background:#fff;color:#0a0e14;display:grid;place-items:center;min-height:100vh;margin:0}main{max-width:420px;padding:48px 32px;text-align:center}h1{font-size:28px;letter-spacing:-.025em;margin:0 0 12px}p{color:#3c4250;line-height:1.55}a{color:#d63a05;font-weight:500}</style><main><h1>You're confirmed.</h1><p>We'll email when your spot on the VettGuard waitlist opens.</p><p style="margin-top:32px;font-size:14px"><a href="https://vettguard.com">Back to vettguard.com</a></p></main>`))
	})

	s.Router.Post("/v1/auth/confirm-password-reset", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Token       string `json:"token"`
			NewPassword string `json:"newPassword"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil ||
			body.Token == "" || body.NewPassword == "" {
			httpErr(w, http.StatusBadRequest, "token + newPassword required")
			return
		}
		if err := usecase.ConfirmPasswordReset(r.Context(), pool, body.Token, body.NewPassword); err != nil {
			if err == usecase.ErrTokenInvalid {
				httpErr(w, http.StatusUnauthorized, "token invalid or expired")
				return
			}
			log.Error().Err(err).Msg("confirm password reset")
			httpErr(w, http.StatusInternalServerError, "reset failed")
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]bool{"ok": true})
	})

	if err := s.Run(ctx); err != nil {
		log.Fatal().Err(err).Msg("server stopped with error")
	}
}

func httpErr(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
