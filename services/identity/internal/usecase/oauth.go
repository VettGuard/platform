package usecase

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vettguard/vettguard/services/identity/internal/db"
	"github.com/vettguard/vettguard/services/shared/pkg/pgxdb"
)

// LinkOrCreateOutput tells the caller whether a new account was created and
// which user the OAuth identity now points to. Memberships are returned so
// the caller can decide which tenant to bind the session to.
type LinkOrCreateOutput struct {
	UserID      uuid.UUID
	FullName    string
	Created     bool
	Memberships []Membership
}

// LinkOrCreateOAuthUser resolves an OAuth identity to a user account:
//  1. If a row in oauth_links matches (provider, external_id), return that user.
//  2. Else if a user with the same email exists, attach the OAuth identity to it.
//  3. Else create a brand-new user (no tenant — caller must onboard).
//
// Step 3 returns Created=true with an empty Memberships slice. The dashboard
// surfaces a "complete your tenant" step in that case.
func LinkOrCreateOAuthUser(
	ctx context.Context,
	pool *pgxpool.Pool,
	provider, externalID, email, fullName string,
) (LinkOrCreateOutput, error) {
	if provider == "" || externalID == "" || email == "" {
		return LinkOrCreateOutput{}, errors.New("oauth: missing provider/externalID/email")
	}
	email = strings.ToLower(strings.TrimSpace(email))

	var out LinkOrCreateOutput
	err := pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)

		// 1. Existing OAuth link?
		link, err := q.GetOAuthLink(ctx, db.GetOAuthLinkParams{
			Provider:   provider,
			ExternalID: externalID,
		})
		if err == nil {
			return populateUserAndMemberships(ctx, q, link.UserID, &out)
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("oauth link lookup: %w", err)
		}

		// 2. Email already known? Attach.
		user, err := q.GetUserByEmail(ctx, email)
		switch {
		case err == nil:
			if _, err := q.UpsertOAuthLink(ctx, db.UpsertOAuthLinkParams{
				UserID:     user.ID,
				Provider:   provider,
				ExternalID: externalID,
				Email:      email,
			}); err != nil {
				return fmt.Errorf("oauth link upsert: %w", err)
			}
			return populateUserAndMemberships(ctx, q, user.ID, &out)
		case errors.Is(err, pgx.ErrNoRows):
			// fallthrough to create
		default:
			return fmt.Errorf("oauth user lookup: %w", err)
		}

		// 3. New user. password_hash NULL, email auto-verified (OAuth provider asserts it).
		created, err := q.CreateUser(ctx, db.CreateUserParams{
			Email:        email,
			PasswordHash: pgxNullable(""),
			FullName:     fullName,
			Locale:       "en",
		})
		if err != nil {
			return fmt.Errorf("oauth create user: %w", err)
		}
		if err := q.MarkUserVerified(ctx, created.ID); err != nil {
			return fmt.Errorf("oauth mark verified: %w", err)
		}
		if _, err := q.UpsertOAuthLink(ctx, db.UpsertOAuthLinkParams{
			UserID:     created.ID,
			Provider:   provider,
			ExternalID: externalID,
			Email:      email,
		}); err != nil {
			return fmt.Errorf("oauth link insert: %w", err)
		}
		out.UserID = created.ID
		out.FullName = created.FullName
		out.Created = true
		// No memberships yet — caller routes to tenant onboarding.
		return nil
	})
	return out, err
}

func populateUserAndMemberships(ctx context.Context, q *db.Queries, userID uuid.UUID, out *LinkOrCreateOutput) error {
	u, err := q.GetUserByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("get user: %w", err)
	}
	rows, err := q.ListMembershipsForUser(ctx, userID)
	if err != nil {
		return fmt.Errorf("list memberships: %w", err)
	}
	out.UserID = u.ID
	out.FullName = u.FullName
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
}
