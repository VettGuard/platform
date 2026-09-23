package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vettguard/vettguard/services/identity/internal/auth"
	"github.com/vettguard/vettguard/services/identity/internal/db"
	"github.com/vettguard/vettguard/services/shared/pkg/pgxdb"
)

const passwordResetTTL = 1 * time.Hour

// RequestPasswordReset issues a single-use reset token and emails it.
// Returns nil even when the email is unknown to avoid enumeration.
func RequestPasswordReset(
	ctx context.Context,
	pool *pgxpool.Pool,
	urls URLBuilder,
	notifier Notifier,
	email string,
) error {
	raw, hash, err := auth.NewToken()
	if err != nil {
		return fmt.Errorf("issue token: %w", err)
	}

	var notifyTarget string
	var notifyName string
	err = pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		user, err := q.GetUserByEmail(ctx, email)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil // silent — anti-enumeration
			}
			return fmt.Errorf("lookup user: %w", err)
		}
		if _, err := q.CreatePasswordReset(ctx, db.CreatePasswordResetParams{
			UserID:    user.ID,
			TokenHash: hash,
			ExpiresAt: pgxTime(time.Now().Add(passwordResetTTL)),
		}); err != nil {
			return fmt.Errorf("create reset: %w", err)
		}
		notifyTarget = string(user.Email)
		notifyName = user.FullName
		return nil
	})
	if err != nil {
		return err
	}

	if notifyTarget == "" {
		return nil // anti-enumeration silent return
	}
	resetURL := urls.PasswordResetURL(raw)
	if err := notifier.SendPasswordResetEmail(ctx, notifyTarget, notifyName, resetURL); err != nil {
		return fmt.Errorf("send reset email: %w", err)
	}
	return nil
}

// ConfirmPasswordReset consumes the reset token and sets the new password.
// Also revokes every active session for the user (defense in depth).
func ConfirmPasswordReset(ctx context.Context, pool *pgxpool.Pool, rawToken, newPassword string) error {
	hash := auth.HashToken(rawToken)
	newHash, err := auth.HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	return pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)

		pr, err := q.ConsumePasswordReset(ctx, hash)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrTokenInvalid
			}
			return fmt.Errorf("consume reset: %w", err)
		}
		if err := q.SetUserPassword(ctx, db.SetUserPasswordParams{
			ID:           pr.UserID,
			PasswordHash: pgxNullable(newHash),
		}); err != nil {
			return fmt.Errorf("set password: %w", err)
		}
		if err := q.RevokeAllUserSessions(ctx, pr.UserID); err != nil {
			return fmt.Errorf("revoke sessions: %w", err)
		}
		return nil
	})
}
