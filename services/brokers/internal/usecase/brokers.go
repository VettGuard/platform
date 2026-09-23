// Package usecase implements the brokers service business logic.
//
// Storage is tenant-scoped via RLS — each operation runs inside a
// `WithTenantTx` transaction so Postgres enforces row visibility from
// app.tenant_id (set per-tx). Scoring is computed server-side from a
// deterministic FNV-1a hash of the MC# until the AI gateway exposes a
// real broker-scoring endpoint (Sprint 5).
package usecase

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vettguard/vettguard/services/shared/pkg/pgxdb"
	"github.com/vettguard/vettguard/services/shared/pkg/tenantctx"
)

// Broker is the read-side row returned by List / Get / Vet.
type Broker struct {
	ID             uuid.UUID
	TenantID       uuid.UUID
	MC             string
	Name           string
	City           string
	Score          int
	PayDays        int
	Loads          int
	RecoveredCents int64
	Status         string
	LastScoredAt   time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// VetInput is the payload from the dashboard's "Vet new" flow.
type VetInput struct {
	MC   string
	Name string // optional — service falls back to "Pending FMCSA lookup"
	City string // optional — same
}

var (
	ErrInvalidMC  = errors.New("brokers: invalid MC number")
	ErrNotFound   = errors.New("brokers: not found")
)

// Vet upserts a (tenant, broker) row. If the row already exists we
// recompute the score (cheap — FNV-1a hash) and bump last_scored_at;
// otherwise insert a new one. Either way, the returned Broker is the
// post-state, ready for the dashboard to render.
//
// Tenant id is read from tenantctx (populated by the JWT middleware at
// the gateway and forwarded as X-Tenant-ID).
func Vet(ctx context.Context, pool *pgxpool.Pool, in VetInput) (*Broker, error) {
	tenantID, err := tenantID(ctx)
	if err != nil {
		return nil, err
	}
	mc, err := normalizeMC(in.MC)
	if err != nil {
		return nil, err
	}
	// Score via AI when configured (tenant id is read from ctx for budget),
	// otherwise the function falls back to the FNV-1a mock.
	s := ScoreForCtx(ctx, mc, in.Name, in.City)
	name := strings.TrimSpace(in.Name)
	if name == "" {
		name = "Pending FMCSA lookup"
	}
	city := strings.TrimSpace(in.City)

	var b Broker
	err = pgxdb.WithTenantTx(ctx, pool, func(tx pgx.Tx) error {
		return tx.QueryRow(ctx, `
			INSERT INTO vetted_brokers
				(tenant_id, mc, name, city, score, pay_days, loads, recovered_cents, status, last_scored_at)
			VALUES ($1, $2, $3, $4, $5, $6, 0, 0, $7, now())
			ON CONFLICT (tenant_id, mc) DO UPDATE SET
				score          = EXCLUDED.score,
				pay_days       = EXCLUDED.pay_days,
				status         = EXCLUDED.status,
				name           = CASE WHEN vetted_brokers.name = 'Pending FMCSA lookup' THEN EXCLUDED.name ELSE vetted_brokers.name END,
				city           = CASE WHEN vetted_brokers.city = ''                       THEN EXCLUDED.city ELSE vetted_brokers.city END,
				last_scored_at = now()
			RETURNING id, tenant_id, mc, name, city, score, pay_days, loads, recovered_cents, status, last_scored_at, created_at, updated_at
		`,
			tenantID, mc, name, city, s.Value, s.PayDays, s.Status,
		).Scan(
			&b.ID, &b.TenantID, &b.MC, &b.Name, &b.City, &b.Score,
			&b.PayDays, &b.Loads, &b.RecoveredCents, &b.Status,
			&b.LastScoredAt, &b.CreatedAt, &b.UpdatedAt,
		)
	})
	if err != nil {
		return nil, fmt.Errorf("vet broker: %w", err)
	}
	return &b, nil
}

// List returns every vetted broker for the tenant, ordered by score
// desc. Pagination is a Sprint 5 concern — the current dashboard
// renders all rows.
func List(ctx context.Context, pool *pgxpool.Pool) ([]Broker, error) {
	var out []Broker
	err := pgxdb.WithTenantTx(ctx, pool, func(tx pgx.Tx) error {
		rows, err := tx.Query(ctx, `
			SELECT id, tenant_id, mc, name, city, score, pay_days, loads, recovered_cents, status, last_scored_at, created_at, updated_at
			FROM vetted_brokers
			ORDER BY score DESC, name ASC
		`)
		if err != nil {
			return err
		}
		defer rows.Close()
		for rows.Next() {
			var b Broker
			if err := rows.Scan(
				&b.ID, &b.TenantID, &b.MC, &b.Name, &b.City, &b.Score,
				&b.PayDays, &b.Loads, &b.RecoveredCents, &b.Status,
				&b.LastScoredAt, &b.CreatedAt, &b.UpdatedAt,
			); err != nil {
				return err
			}
			out = append(out, b)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, fmt.Errorf("list brokers: %w", err)
	}
	return out, nil
}

// Get fetches one broker by MC. Returns ErrNotFound if the tenant
// hasn't vetted it.
func Get(ctx context.Context, pool *pgxpool.Pool, mc string) (*Broker, error) {
	norm, err := normalizeMC(mc)
	if err != nil {
		return nil, err
	}
	var b Broker
	err = pgxdb.WithTenantTx(ctx, pool, func(tx pgx.Tx) error {
		row := tx.QueryRow(ctx, `
			SELECT id, tenant_id, mc, name, city, score, pay_days, loads, recovered_cents, status, last_scored_at, created_at, updated_at
			FROM vetted_brokers
			WHERE mc = $1
		`, norm)
		err := row.Scan(
			&b.ID, &b.TenantID, &b.MC, &b.Name, &b.City, &b.Score,
			&b.PayDays, &b.Loads, &b.RecoveredCents, &b.Status,
			&b.LastScoredAt, &b.CreatedAt, &b.UpdatedAt,
		)
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return err
	})
	if err != nil {
		return nil, err
	}
	return &b, nil
}

// tenantID pulls the active tenant from the context (set by the gateway's
// auth middleware). Returns an error so handlers can map to Unauthenticated.
func tenantID(ctx context.Context) (uuid.UUID, error) {
	tc, err := tenantctx.From(ctx)
	if err != nil {
		return uuid.Nil, fmt.Errorf("no tenant context: %w", err)
	}
	if tc.TenantID == uuid.Nil {
		return uuid.Nil, errors.New("brokers: tenant id missing")
	}
	return tc.TenantID, nil
}

// normalizeMC accepts "MC123", "mc-123", "  MC-00123  " and returns the
// canonical "MC-NNNNN" string. Rejects non-numeric and zero-length input.
func normalizeMC(raw string) (string, error) {
	s := strings.ToUpper(strings.TrimSpace(raw))
	s = strings.TrimPrefix(s, "MC-")
	s = strings.TrimPrefix(s, "MC")
	s = strings.TrimSpace(s)
	if s == "" {
		return "", ErrInvalidMC
	}
	for _, r := range s {
		if r < '0' || r > '9' {
			return "", ErrInvalidMC
		}
	}
	if len(s) < 3 || len(s) > 9 {
		return "", ErrInvalidMC
	}
	return "MC-" + s, nil
}
