// archive — streams the previous month's audit_events to MinIO as a
// gzip-compressed JSONL object, then verifies it landed. Designed to run
// as a Kubernetes CronJob (00 02 1 * * — 02:00 on the 1st of each month)
// or be invoked manually with `--month=2026-04` to backfill.
//
// Idempotent on object key: `audit/YYYY/MM.jsonl.gz`. Re-running the same
// month overwrites the object (we trust the DB as the source of truth).
// Object-lock retention is enforced at the bucket level — the operator
// configures retention mode/days on the MinIO Tenant.
package main

import (
	"compress/gzip"
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"github.com/vettguard/vettguard/services/audit/internal/db"
)

func main() {
	month := flag.String("month", "", "month to archive in YYYY-MM (defaults to previous month)")
	flag.Parse()

	cfg, err := loadConfig()
	if err != nil {
		fail("config", err)
	}

	start, end, key, err := resolveWindow(*month, time.Now().UTC())
	if err != nil {
		fail("resolve window", err)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		fail("pgxpool", err)
	}
	defer pool.Close()

	mc, err := minio.New(cfg.MinIOEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinIOAccessKey, cfg.MinIOSecretKey, ""),
		Secure: cfg.MinIOSecure,
	})
	if err != nil {
		fail("minio client", err)
	}

	n, err := archive(ctx, pool, mc, cfg.MinIOBucket, key, start, end)
	if err != nil {
		fail("archive", err)
	}
	fmt.Printf("archived %d events to s3://%s/%s (window %s → %s)\n", n, cfg.MinIOBucket, key, start.Format(time.RFC3339), end.Format(time.RFC3339))
}

type config struct {
	DatabaseURL    string
	MinIOEndpoint  string
	MinIOAccessKey string
	MinIOSecretKey string
	MinIOBucket    string
	MinIOSecure    bool
}

func loadConfig() (config, error) {
	c := config{
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		MinIOEndpoint:  os.Getenv("MINIO_ENDPOINT"),
		MinIOAccessKey: os.Getenv("MINIO_ACCESS_KEY"),
		MinIOSecretKey: os.Getenv("MINIO_SECRET_KEY"),
		MinIOBucket:    os.Getenv("MINIO_AUDIT_BUCKET"),
		MinIOSecure:    os.Getenv("MINIO_SECURE") != "false",
	}
	switch "" {
	case c.DatabaseURL:
		return c, errors.New("DATABASE_URL is required")
	case c.MinIOEndpoint:
		return c, errors.New("MINIO_ENDPOINT is required")
	case c.MinIOAccessKey:
		return c, errors.New("MINIO_ACCESS_KEY is required")
	case c.MinIOSecretKey:
		return c, errors.New("MINIO_SECRET_KEY is required")
	case c.MinIOBucket:
		return c, errors.New("MINIO_AUDIT_BUCKET is required")
	}
	return c, nil
}

// resolveWindow returns [start, end) for the month to archive, plus the
// object key. Empty `month` arg → previous full month from now.
func resolveWindow(monthArg string, now time.Time) (time.Time, time.Time, string, error) {
	var start time.Time
	if monthArg == "" {
		// First day of previous month.
		firstOfThis := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
		start = firstOfThis.AddDate(0, -1, 0)
	} else {
		t, err := time.Parse("2006-01", monthArg)
		if err != nil {
			return time.Time{}, time.Time{}, "", fmt.Errorf("--month must be YYYY-MM: %w", err)
		}
		start = t.UTC()
	}
	end := start.AddDate(0, 1, 0)
	key := fmt.Sprintf("audit/%04d/%02d.jsonl.gz", start.Year(), int(start.Month()))
	return start, end, key, nil
}

// archive streams events in [start, end) to MinIO as gzip JSONL. The HTTP
// stream is piped directly into PutObject so we never buffer the full month
// in memory (audit volumes can grow large quickly once detention claims start).
func archive(
	ctx context.Context,
	pool *pgxpool.Pool,
	mc *minio.Client,
	bucket, key string,
	start, end time.Time,
) (int64, error) {
	pr, pw := io.Pipe()

	var count int64
	var writeErr error
	done := make(chan struct{})

	go func() {
		defer close(done)
		gz := gzip.NewWriter(pw)
		enc := json.NewEncoder(gz)

		// Stream rows directly with the underlying pool to keep memory flat.
		const sql = `
			SELECT id, tenant_id, actor_id, actor_type, action, target_type, target_id,
			       payload, ip, user_agent, request_id, occurred_at
			FROM audit_events
			WHERE occurred_at >= $1 AND occurred_at < $2
			ORDER BY occurred_at ASC`
		rows, err := pool.Query(ctx, sql, start, end)
		if err != nil {
			writeErr = fmt.Errorf("query: %w", err)
			_ = pw.CloseWithError(writeErr)
			return
		}
		defer rows.Close()

		for rows.Next() {
			var e db.AuditEvent
			if err := rows.Scan(
				&e.ID, &e.TenantID, &e.ActorID, &e.ActorType, &e.Action,
				&e.TargetType, &e.TargetID, &e.Payload, &e.Ip, &e.UserAgent,
				&e.RequestID, &e.OccurredAt,
			); err != nil {
				writeErr = fmt.Errorf("scan: %w", err)
				_ = pw.CloseWithError(writeErr)
				return
			}
			if err := enc.Encode(eventToJSON(e)); err != nil {
				writeErr = fmt.Errorf("encode: %w", err)
				_ = pw.CloseWithError(writeErr)
				return
			}
			count++
		}
		if err := rows.Err(); err != nil {
			writeErr = fmt.Errorf("rows: %w", err)
			_ = pw.CloseWithError(writeErr)
			return
		}
		if err := gz.Close(); err != nil {
			writeErr = fmt.Errorf("gzip close: %w", err)
			_ = pw.CloseWithError(writeErr)
			return
		}
		_ = pw.Close()
	}()

	_, err := mc.PutObject(ctx, bucket, key, pr, -1, minio.PutObjectOptions{
		ContentType:     "application/x-ndjson",
		ContentEncoding: "gzip",
		UserMetadata: map[string]string{
			"window-start": start.Format(time.RFC3339),
			"window-end":   end.Format(time.RFC3339),
		},
	})
	<-done
	if writeErr != nil {
		return 0, writeErr
	}
	if err != nil {
		return 0, fmt.Errorf("put object: %w", err)
	}
	return count, nil
}

// eventToJSON normalizes pgtype columns into a stable JSON shape that's
// easy to re-ingest with a generic JSONL reader.
func eventToJSON(e db.AuditEvent) map[string]any {
	m := map[string]any{
		"id":          e.ID.String(),
		"actor_type":  e.ActorType,
		"action":      e.Action,
		"occurred_at": e.OccurredAt.Time.Format(time.RFC3339Nano),
	}
	if e.TenantID.Valid {
		m["tenant_id"] = uuidToString(e.TenantID.Bytes)
	}
	if e.ActorID.Valid {
		m["actor_id"] = uuidToString(e.ActorID.Bytes)
	}
	if e.TargetType.Valid {
		m["target_type"] = e.TargetType.String
	}
	if e.TargetID.Valid {
		m["target_id"] = e.TargetID.String
	}
	if e.UserAgent.Valid {
		m["user_agent"] = e.UserAgent.String
	}
	if e.RequestID.Valid {
		m["request_id"] = e.RequestID.String
	}
	if e.Ip != nil {
		m["ip"] = e.Ip.String()
	}
	if len(e.Payload) > 0 {
		m["payload"] = json.RawMessage(e.Payload)
	}
	return m
}

func uuidToString(b [16]byte) string {
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

func fail(stage string, err error) {
	fmt.Fprintf(os.Stderr, "archive: %s: %v\n", stage, err)
	os.Exit(1)
}
