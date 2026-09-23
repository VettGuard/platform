// Package pgxdb wires a pgx connection pool with VettGuard's RLS discipline.
//
// Every transaction started via WithTenantTx sets `app.tenant_id` at the start
// (SET LOCAL) so that any query inside the tx is scoped by Postgres Row-Level
// Security policies. Code that bypasses RLS (admin tooling) must use a
// separate Pool created with a role that has BYPASSRLS and is audited.
package pgxdb

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vettguard/vettguard/services/shared/pkg/tenantctx"
)

// Open returns a configured pool. Caller owns its lifecycle (defer Close()).
func Open(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("parse dsn: %w", err)
	}
	cfg.MaxConns = 20
	cfg.MinConns = 2
	cfg.MaxConnLifetime = 30 * time.Minute
	cfg.MaxConnIdleTime = 5 * time.Minute
	cfg.HealthCheckPeriod = 1 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("new pool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping: %w", err)
	}
	return pool, nil
}

// WithTenantTx starts a transaction whose RLS context is bound to the tenant
// on ctx. The callback receives a Tx; commit/rollback is automatic based on
// the error it returns.
//
//	err := pgxdb.WithTenantTx(ctx, pool, func(tx pgx.Tx) error {
//	    _, err := tx.Exec(ctx, "INSERT INTO memberships ...")
//	    return err
//	})
func WithTenantTx(ctx context.Context, pool *pgxpool.Pool, fn func(pgx.Tx) error) error {
	tc, err := tenantctx.From(ctx)
	if err != nil {
		return fmt.Errorf("WithTenantTx: %w", err)
	}

	tx, err := pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.ReadCommitted})
	if err != nil {
		return fmt.Errorf("begin: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }() // no-op after Commit

	if _, err := tx.Exec(ctx, "SET LOCAL app.tenant_id = $1", tc.TenantID.String()); err != nil {
		return fmt.Errorf("set tenant_id: %w", err)
	}

	if err := fn(tx); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		if errors.Is(err, pgx.ErrTxClosed) {
			return nil
		}
		return fmt.Errorf("commit: %w", err)
	}
	return nil
}

// WithBypassTx opens a transaction WITHOUT setting app.tenant_id. Use only for:
//   - migrations
//   - cross-tenant admin operations (audited)
//   - global tables (users, oauth_links, mfa_factors) where the requesting
//     identity has already been verified at the application layer
func WithBypassTx(ctx context.Context, pool *pgxpool.Pool, fn func(pgx.Tx) error) error {
	tx, err := pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.ReadCommitted})
	if err != nil {
		return fmt.Errorf("begin: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := fn(tx); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
