package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vettguard/vettguard/services/identity/internal/auth"
	"github.com/vettguard/vettguard/services/identity/internal/db"
	"github.com/vettguard/vettguard/services/shared/pkg/pgxdb"
)

type LoginInput struct {
	Email    string
	Password string
}

// LoginOutput returns the user + every tenant they belong to. The caller
// (gateway / dashboard) picks a tenant context for the new session.
type LoginOutput struct {
	UserID         uuid.UUID
	FullName       string
	EmailVerified  bool
	Memberships    []Membership
}

type Membership struct {
	TenantID   uuid.UUID
	TenantName string
	TenantSlug string
	Role       string
}

// Login verifies email+password, enforces the lockout window, and returns
// the user's memberships. Issuing tokens is the caller's job (separate use case).
func Login(ctx context.Context, pool *pgxpool.Pool, in LoginInput) (LoginOutput, error) {
	var out LoginOutput
	err := pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)

		user, err := q.GetUserByEmail(ctx, in.Email)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				// Same error as wrong password to avoid email enumeration.
				return ErrBadCredentials
			}
			return fmt.Errorf("lookup user: %w", err)
		}

		if !user.LockedUntil.Time.IsZero() && user.LockedUntil.Time.After(time.Now()) {
			return ErrAccountLocked
		}

		if !user.PasswordHash.Valid {
			// OAuth-only account; tell user to use the SSO button.
			return ErrBadCredentials
		}
		if err := auth.VerifyPassword(user.PasswordHash.String, in.Password); err != nil {
			if _, incErr := q.IncrementFailedLogin(ctx, user.ID); incErr != nil {
				return fmt.Errorf("increment failed_login: %w", incErr)
			}
			return ErrBadCredentials
		}
		if err := q.ResetFailedLogin(ctx, user.ID); err != nil {
			return fmt.Errorf("reset failed_login: %w", err)
		}

		rows, err := q.ListMembershipsForUser(ctx, user.ID)
		if err != nil {
			return fmt.Errorf("list memberships: %w", err)
		}

		out.UserID = user.ID
		out.FullName = user.FullName
		out.EmailVerified = user.EmailVerifiedAt.Valid
		out.Memberships = make([]Membership, len(rows))
		for i, r := range rows {
			out.Memberships[i] = Membership{
				TenantID:   r.TenantID,
				TenantName: r.TenantName,
				TenantSlug: r.TenantSlug,
				Role:       r.Role,
			}
		}
		return nil
	})
	return out, err
}
