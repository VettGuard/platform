package usecase

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vettguard/vettguard/services/identity/internal/auth"
	"github.com/vettguard/vettguard/services/identity/internal/db"
	"github.com/vettguard/vettguard/services/shared/pkg/pgxdb"
)

// ErrNoPendingTOTP is returned by VerifyTOTP when no unverified factor exists.
var ErrNoPendingTOTP = errors.New("usecase: no pending TOTP factor")

type EnableTOTPOutput struct {
	FactorID      uuid.UUID
	Secret        string
	OtpAuthURL    string
	RecoveryCodes []string
}

// EnableTOTP starts a TOTP enrollment for userID. Caller must already
// know the user is authenticated. The returned factor is stored in
// `unverified` state — `VerifyTOTP` flips verified_at once the user
// proves possession of the device. Recovery codes are stored hashed.
func EnableTOTP(
	ctx context.Context,
	pool *pgxpool.Pool,
	aead *auth.AEAD,
	userID uuid.UUID,
	accountLabel string,
) (EnableTOTPOutput, error) {
	setup, err := auth.GenerateTOTP(accountLabel)
	if err != nil {
		return EnableTOTPOutput{}, fmt.Errorf("totp generate: %w", err)
	}
	encSecret, err := aead.Seal([]byte(setup.Secret))
	if err != nil {
		return EnableTOTPOutput{}, fmt.Errorf("seal secret: %w", err)
	}

	var factorID uuid.UUID
	err = pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		f, err := q.CreateMFAFactor(ctx, db.CreateMFAFactorParams{
			UserID:          userID,
			Type:            "totp",
			SecretEncrypted: encSecret,
			Label:           pgtype.Text{String: accountLabel, Valid: true},
		})
		if err != nil {
			return fmt.Errorf("insert totp factor: %w", err)
		}
		factorID = f.ID

		// Recovery codes: one row per code, hashed (sha256). Reused for
		// emergency login. Removed on use (Step 7 lookup query — for now we
		// just persist; consume-path is a Sprint 2 stretch).
		for _, code := range setup.RecoveryCodes {
			if _, err := q.CreateMFAFactor(ctx, db.CreateMFAFactorParams{
				UserID:          userID,
				Type:            "recovery",
				SecretEncrypted: []byte(auth.HashToken(code)),
				Label:           pgtype.Text{Valid: false},
			}); err != nil {
				return fmt.Errorf("insert recovery code: %w", err)
			}
		}
		return nil
	})
	if err != nil {
		return EnableTOTPOutput{}, err
	}

	return EnableTOTPOutput{
		FactorID:      factorID,
		Secret:        setup.Secret,
		OtpAuthURL:    setup.OtpAuthURL,
		RecoveryCodes: setup.RecoveryCodes,
	}, nil
}

// VerifyTOTP confirms the user can produce a valid code from the device.
// Marks the most-recent unverified TOTP factor as verified.
func VerifyTOTP(
	ctx context.Context,
	pool *pgxpool.Pool,
	aead *auth.AEAD,
	userID uuid.UUID,
	code string,
) error {
	return pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		factors, err := q.ListMFAFactorsForUser(ctx, userID)
		if err != nil {
			return fmt.Errorf("list factors: %w", err)
		}
		for _, f := range factors {
			if f.Type != "totp" || f.VerifiedAt.Valid {
				continue
			}
			secret, err := aead.Open(f.SecretEncrypted)
			if err != nil {
				return fmt.Errorf("open secret: %w", err)
			}
			if !auth.ValidateTOTP(string(secret), code) {
				return ErrTokenInvalid
			}
			if err := q.VerifyMFAFactor(ctx, f.ID); err != nil {
				return fmt.Errorf("mark verified: %w", err)
			}
			return nil
		}
		return ErrNoPendingTOTP
	})
}

// HasVerifiedTOTP reports whether the user has at least one verified TOTP factor.
// Login should require a code when this is true.
func HasVerifiedTOTP(ctx context.Context, pool *pgxpool.Pool, userID uuid.UUID) (bool, error) {
	var has bool
	err := pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		factors, err := q.ListMFAFactorsForUser(ctx, userID)
		if err != nil {
			return err
		}
		for _, f := range factors {
			if f.Type == "totp" && f.VerifiedAt.Valid {
				has = true
				return nil
			}
		}
		return nil
	})
	return has, err
}

// CheckTOTPCode validates a TOTP code against the user's verified factor.
// Returns ErrBadCredentials when no verified factor exists or code is wrong.
func CheckTOTPCode(
	ctx context.Context,
	pool *pgxpool.Pool,
	aead *auth.AEAD,
	userID uuid.UUID,
	code string,
) error {
	return pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		factors, err := q.ListMFAFactorsForUser(ctx, userID)
		if err != nil {
			return err
		}
		for _, f := range factors {
			if f.Type != "totp" || !f.VerifiedAt.Valid {
				continue
			}
			secret, err := aead.Open(f.SecretEncrypted)
			if err != nil {
				return fmt.Errorf("open secret: %w", err)
			}
			if auth.ValidateTOTP(string(secret), code) {
				return nil
			}
		}
		return ErrBadCredentials
	})
}
