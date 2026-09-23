package usecase

import (
	"context"
	"errors"
	"fmt"
	"net/netip"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vettguard/vettguard/services/identity/internal/auth"
	"github.com/vettguard/vettguard/services/identity/internal/db"
	"github.com/vettguard/vettguard/services/shared/pkg/pgxdb"
)

// refreshTTL is the absolute lifetime of a refresh token. Each rotation
// resets the window, so an active user gets a sliding 7-day session.
const refreshTTL = 7 * 24 * time.Hour

// SessionTokens is what we hand to the client after login or refresh.
// AccessToken goes in Authorization header; RefreshToken goes in an
// HttpOnly Secure SameSite=Strict cookie (gateway responsibility).
type SessionTokens struct {
	AccessToken  string
	AccessExp    time.Time
	RefreshToken string
	RefreshExp   time.Time
	SessionID    uuid.UUID
}

// IssueSessionInput binds a freshly-authenticated user to a chosen tenant.
type IssueSessionInput struct {
	UserID    uuid.UUID
	TenantID  uuid.UUID
	UserAgent string
	IP        string // remote addr; parsed to inet, empty → NULL
}

// IssueSession validates the user's membership in the chosen tenant, then
// mints an access JWT + opaque refresh token whose sha256 is stored.
func IssueSession(
	ctx context.Context,
	pool *pgxpool.Pool,
	signer *auth.JWTSigner,
	in IssueSessionInput,
) (SessionTokens, error) {
	rawRefresh, refreshHash, err := auth.NewToken()
	if err != nil {
		return SessionTokens{}, fmt.Errorf("issue refresh token: %w", err)
	}

	var role string
	var session db.Session
	err = pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		m, err := q.GetMembership(ctx, db.GetMembershipParams{
			TenantID: in.TenantID,
			UserID:   in.UserID,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrBadCredentials
			}
			return fmt.Errorf("lookup membership: %w", err)
		}
		role = m.Role

		session, err = q.CreateSession(ctx, db.CreateSessionParams{
			UserID:           in.UserID,
			TenantID:         in.TenantID,
			RefreshTokenHash: refreshHash,
			UserAgent:        pgxNullable(in.UserAgent),
			Ip:               parseInet(in.IP),
			ExpiresAt:        pgxTime(time.Now().Add(refreshTTL)),
		})
		if err != nil {
			return fmt.Errorf("create session: %w", err)
		}
		return nil
	})
	if err != nil {
		return SessionTokens{}, err
	}

	accessTok, claims, err := signer.IssueAccess(in.UserID, in.TenantID, role)
	if err != nil {
		return SessionTokens{}, fmt.Errorf("sign access: %w", err)
	}
	return SessionTokens{
		AccessToken:  accessTok,
		AccessExp:    time.Unix(claims.Exp, 0),
		RefreshToken: rawRefresh,
		RefreshExp:   session.ExpiresAt.Time,
		SessionID:    session.ID,
	}, nil
}

// RefreshSession rotates the refresh token (single-use) and mints a fresh
// access JWT. Returns ErrTokenInvalid when the presented token is unknown,
// expired, or already revoked.
func RefreshSession(
	ctx context.Context,
	pool *pgxpool.Pool,
	signer *auth.JWTSigner,
	rawRefresh string,
) (SessionTokens, error) {
	oldHash := auth.HashToken(rawRefresh)
	newRaw, newHash, err := auth.NewToken()
	if err != nil {
		return SessionTokens{}, fmt.Errorf("issue refresh token: %w", err)
	}

	var rotated db.Session
	var role string
	err = pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		// Reuse detection: look up by hash WITHOUT the revoked filter first.
		// If we find a row that is already revoked or expired, the presented
		// token has been seen before — treat as compromise and revoke all
		// sessions for that user.
		seen, err := q.FindSessionByHashIncludingRevoked(ctx, oldHash)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrTokenInvalid
			}
			return fmt.Errorf("lookup session: %w", err)
		}
		if seen.RevokedAt.Valid || seen.ExpiresAt.Time.Before(time.Now()) {
			_ = q.RevokeAllUserSessionsWithReason(ctx, db.RevokeAllUserSessionsWithReasonParams{
				UserID:        seen.UserID,
				RevokedReason: pgtype.Text{String: "refresh_reuse", Valid: true},
			})
			return ErrTokenInvalid
		}
		current := seen
		rotated, err = q.RotateSession(ctx, db.RotateSessionParams{
			ID:               current.ID,
			RefreshTokenHash: newHash,
			ExpiresAt:        pgxTime(time.Now().Add(refreshTTL)),
		})
		if err != nil {
			return fmt.Errorf("rotate session: %w", err)
		}
		m, err := q.GetMembership(ctx, db.GetMembershipParams{
			TenantID: rotated.TenantID,
			UserID:   rotated.UserID,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrTokenInvalid
			}
			return fmt.Errorf("lookup membership: %w", err)
		}
		role = m.Role
		return nil
	})
	if err != nil {
		return SessionTokens{}, err
	}

	accessTok, claims, err := signer.IssueAccess(rotated.UserID, rotated.TenantID, role)
	if err != nil {
		return SessionTokens{}, fmt.Errorf("sign access: %w", err)
	}
	return SessionTokens{
		AccessToken:  accessTok,
		AccessExp:    time.Unix(claims.Exp, 0),
		RefreshToken: newRaw,
		RefreshExp:   rotated.ExpiresAt.Time,
		SessionID:    rotated.ID,
	}, nil
}

// RevokeSessionByRefresh is the logout path: presenter passes their refresh
// token, server invalidates the row. Idempotent on unknown tokens.
func RevokeSessionByRefresh(ctx context.Context, pool *pgxpool.Pool, rawRefresh, reason string) error {
	hash := auth.HashToken(rawRefresh)
	return pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		s, err := q.GetSessionByHash(ctx, hash)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil // already gone — idempotent
			}
			return fmt.Errorf("lookup session: %w", err)
		}
		if reason == "" {
			reason = "user_logout"
		}
		if err := q.RevokeSession(ctx, db.RevokeSessionParams{
			ID:            s.ID,
			RevokedReason: pgtype.Text{String: reason, Valid: true},
		}); err != nil {
			return fmt.Errorf("revoke session: %w", err)
		}
		return nil
	})
}

// parseInet maps an arbitrary remote-addr string to a *netip.Addr. Invalid
// or empty input becomes nil so pgx stores SQL NULL.
func parseInet(s string) *netip.Addr {
	if s == "" {
		return nil
	}
	addr, err := netip.ParseAddr(s)
	if err != nil {
		// Try host:port form.
		ap, err2 := netip.ParseAddrPort(s)
		if err2 != nil {
			return nil
		}
		addr = ap.Addr()
	}
	return &addr
}
