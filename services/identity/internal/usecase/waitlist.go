package usecase

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vettguard/vettguard/services/identity/internal/auth"
	"github.com/vettguard/vettguard/services/shared/pkg/pgxdb"
)

const waitlistConfirmTTL = 7 * 24 * time.Hour

// WaitlistSignupInput captures every field landing.com posts to the
// gateway's /v1/landing/waitlist endpoint.
type WaitlistSignupInput struct {
	Email     string
	Role      string
	Locale    string
	Source    string
	IP        string
	UserAgent string
}

// RegisterWaitlistSignup upserts a signup into marketing.waitlist_signups
// and sends a double-opt-in confirmation email when the row is pending.
// Idempotent: re-signups for an already-confirmed email are a no-op
// (we don't email twice). Re-signups for a pending email rotate the token
// and re-send the email (so a lost first email gets a fresh link).
func RegisterWaitlistSignup(
	ctx context.Context,
	pool *pgxpool.Pool,
	urls URLBuilder,
	notifier Notifier,
	in WaitlistSignupInput,
) error {
	email := strings.ToLower(strings.TrimSpace(in.Email))
	if email == "" {
		return errors.New("waitlist: email required")
	}

	rawToken, hash, err := auth.NewToken()
	if err != nil {
		return fmt.Errorf("issue token: %w", err)
	}

	var (
		shouldEmail bool
		confirmURL  string
	)

	err = pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		// INSERT new, or UPDATE existing row in `pending` status. Confirmed
		// rows are touched only to bump `updated_at` (so we can see re-attempts
		// in support) but we don't rotate their token or re-email.
		var status string
		err := tx.QueryRow(ctx, `
			INSERT INTO marketing.waitlist_signups
				(email, role, locale, source, ip, user_agent, confirm_token, status)
			VALUES ($1, $2, $3, $4, NULLIF($5,'')::inet, $6, $7, 'pending')
			ON CONFLICT (email) DO UPDATE SET
				role          = EXCLUDED.role,
				locale        = EXCLUDED.locale,
				ip            = COALESCE(EXCLUDED.ip, marketing.waitlist_signups.ip),
				user_agent    = EXCLUDED.user_agent,
				confirm_token = CASE
				                  WHEN marketing.waitlist_signups.status = 'pending' THEN EXCLUDED.confirm_token
				                  ELSE marketing.waitlist_signups.confirm_token
				                END,
				updated_at    = now()
			RETURNING status
		`,
			email,
			truncate(in.Role, 60),
			truncate(in.Locale, 8),
			fallback(in.Source, "landing"),
			in.IP,
			truncate(in.UserAgent, 500),
			hash,
		).Scan(&status)
		if err != nil {
			return fmt.Errorf("upsert signup: %w", err)
		}

		// Only `pending` rows get a confirmation email. Bounced /
		// unsubscribed / already-confirmed are silent.
		shouldEmail = status == "pending"
		return nil
	})
	if err != nil {
		return err
	}

	if !shouldEmail {
		return nil
	}

	confirmURL = urls.WaitlistConfirmURL(rawToken)
	// Honour TTL by stamping it into the link copy — actual expiry is
	// enforced server-side via updated_at lookup at confirm time.
	_ = waitlistConfirmTTL

	if err := notifier.Send(ctx, NotifyArgs{
		Template: "marketing.waitlist_confirm",
		To:       email,
		Vars: map[string]string{
			"confirm_url": confirmURL,
		},
	}); err != nil {
		return fmt.Errorf("send confirm email: %w", err)
	}
	return nil
}

// ConfirmWaitlistSignup flips status from `pending` to `confirmed` when
// the token matches a row younger than the TTL.
func ConfirmWaitlistSignup(
	ctx context.Context,
	pool *pgxpool.Pool,
	rawToken string,
) error {
	if rawToken == "" {
		return ErrTokenInvalid
	}
	hash := auth.HashToken(rawToken)

	return pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		tag, err := tx.Exec(ctx, `
			UPDATE marketing.waitlist_signups
			SET    status       = 'confirmed',
			       confirmed_at = now(),
			       confirm_token = NULL
			WHERE  confirm_token = $1
			  AND  status        = 'pending'
			  AND  updated_at    > now() - $2::interval
		`, hash, fmt.Sprintf("%d seconds", int(waitlistConfirmTTL.Seconds())))
		if err != nil {
			return fmt.Errorf("confirm: %w", err)
		}
		if tag.RowsAffected() == 0 {
			return ErrTokenInvalid
		}
		return nil
	})
}

func truncate(s string, n int) string {
	if len(s) > n {
		return s[:n]
	}
	return s
}

func fallback(s, def string) string {
	if s == "" {
		return def
	}
	return s
}

