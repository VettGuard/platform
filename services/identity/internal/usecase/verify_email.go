package usecase

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vettguard/vettguard/services/identity/internal/auth"
	"github.com/vettguard/vettguard/services/identity/internal/db"
	"github.com/vettguard/vettguard/services/shared/pkg/pgxdb"
)

// VerifyEmail consumes a verification token (single-use), marking the
// associated user as verified. Returns ErrTokenInvalid for expired / used /
// unknown tokens.
func VerifyEmail(ctx context.Context, pool *pgxpool.Pool, rawToken string) error {
	hash := auth.HashToken(rawToken)

	return pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)

		ev, err := q.ConsumeEmailVerification(ctx, hash)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrTokenInvalid
			}
			return fmt.Errorf("consume token: %w", err)
		}

		if err := q.MarkUserVerified(ctx, ev.UserID); err != nil {
			return fmt.Errorf("mark verified: %w", err)
		}
		return nil
	})
}
