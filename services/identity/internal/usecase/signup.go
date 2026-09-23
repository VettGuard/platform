package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vettguard/vettguard/services/identity/internal/auth"
	"github.com/vettguard/vettguard/services/identity/internal/db"
	"github.com/vettguard/vettguard/services/shared/pkg/pgxdb"
)

// SignUpInput is what an unauthenticated user POSTs to /v1/auth/signup.
type SignUpInput struct {
	TenantName string
	TenantSlug string
	Email      string
	Password   string
	FullName   string
	Locale     string // "en" | "uz" | "ru" | "es" | "tr" | "uk"
}

type SignUpOutput struct {
	TenantID uuid.UUID
	UserID   uuid.UUID
}

const verificationTTL = 24 * time.Hour

// SignUp creates a tenant + user + owner-membership atomically and sends an
// email-verification link. The user cannot log in until the email is verified.
//
// Uses WithBypassTx because tenant + user + membership creation crosses tenant
// boundaries (no tenant exists yet at the moment of insert). The new tenant's
// rows are inserted with an explicit tenant_id, so they remain isolated once
// other tenants exist.
func SignUp(
	ctx context.Context,
	pool *pgxpool.Pool,
	urls URLBuilder,
	notifier Notifier,
	in SignUpInput,
) (SignUpOutput, error) {
	if in.Locale == "" {
		in.Locale = "en"
	}

	hashed, err := auth.HashPassword(in.Password)
	if err != nil {
		return SignUpOutput{}, fmt.Errorf("hash password: %w", err)
	}
	rawToken, tokenHash, err := auth.NewToken()
	if err != nil {
		return SignUpOutput{}, fmt.Errorf("issue token: %w", err)
	}

	var out SignUpOutput
	err = pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)

		tenant, err := q.CreateTenant(ctx, db.CreateTenantParams{
			Name:    in.TenantName,
			Slug:    in.TenantSlug,
			Country: "US",
		})
		if err != nil {
			return mapPgUniqueViolation(err, "tenant slug already taken", nil)
		}

		user, err := q.CreateUser(ctx, db.CreateUserParams{
			Email:        in.Email,
			PasswordHash: pgxNullable(hashed),
			FullName:     in.FullName,
			Locale:       in.Locale,
		})
		if err != nil {
			return mapPgUniqueViolation(err, "", ErrEmailTaken)
		}

		if _, err := q.CreateMembership(ctx, db.CreateMembershipParams{
			TenantID: tenant.ID,
			UserID:   user.ID,
			Role:     "owner",
		}); err != nil {
			return fmt.Errorf("create membership: %w", err)
		}

		if _, err := q.CreateEmailVerification(ctx, db.CreateEmailVerificationParams{
			UserID:    user.ID,
			Email:     in.Email,
			TokenHash: tokenHash,
			ExpiresAt: pgxTime(time.Now().Add(verificationTTL)),
		}); err != nil {
			return fmt.Errorf("create email verification: %w", err)
		}

		out = SignUpOutput{TenantID: tenant.ID, UserID: user.ID}
		return nil
	})
	if err != nil {
		return SignUpOutput{}, err
	}

	verifyURL := urls.VerifyEmailURL(rawToken)
	if err := notifier.SendVerificationEmail(ctx, in.Email, in.FullName, verifyURL); err != nil {
		// Non-fatal: user exists, they can request a resend. Log at caller.
		return out, fmt.Errorf("send verification email: %w", err)
	}
	return out, nil
}

// mapPgUniqueViolation returns target when the underlying error is a unique
// constraint failure; otherwise wraps the original error. The msg is for
// debug, never surfaced to the client.
func mapPgUniqueViolation(err error, _ string, target error) error {
	if err == nil {
		return nil
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" && target != nil {
		return target
	}
	return err
}
