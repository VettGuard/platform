// Package usecase implements the claims service business logic.
//
// Every operation runs inside `pgxdb.WithTenantTx` so Postgres RLS
// enforces row visibility from `app.tenant_id` (set per-tx from the
// gateway-forwarded X-Tenant-ID header → tenantctx in the handler
// middleware). All money is cents (int64) to avoid float drift.
package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vettguard/vettguard/services/shared/pkg/pgxdb"
	"github.com/vettguard/vettguard/services/shared/pkg/tenantctx"
)

// Claim is the read-side row returned by Create / Draft / List / Get.
type Claim struct {
	ID                  uuid.UUID
	TenantID            uuid.UUID
	Ref                 string
	BrokerMC            string
	BrokerName          string
	LoadRef             string
	DwellHours          float64
	ClaimAmountCents    int64
	RecoveredCents      int64
	Status              string
	DraftedSubject      string
	DraftedBody         string
	AIDrafted           bool
	SuccessFeeInvoiceID string
	SuccessFeeURL       string
	CreatedAt           time.Time
	DraftedAt           *time.Time
	SentAt              *time.Time
	PaidAt              *time.Time
}

// claimColumns + scanClaim keep the SELECT/RETURNING column lists in
// one place so the five queries don't drift apart.
const claimColumns = `id, tenant_id, ref, broker_mc, broker_name, load_ref,
		dwell_hours, claim_amount_cents, recovered_cents, status,
		drafted_subject, drafted_body, ai_drafted,
		success_fee_invoice_id, success_fee_url,
		created_at, drafted_at, sent_at, paid_at`

type scanner interface{ Scan(...any) error }

func scanClaim(row scanner, c *Claim) error {
	return row.Scan(
		&c.ID, &c.TenantID, &c.Ref, &c.BrokerMC, &c.BrokerName, &c.LoadRef,
		&c.DwellHours, &c.ClaimAmountCents, &c.RecoveredCents, &c.Status,
		&c.DraftedSubject, &c.DraftedBody, &c.AIDrafted,
		&c.SuccessFeeInvoiceID, &c.SuccessFeeURL,
		&c.CreatedAt, &c.DraftedAt, &c.SentAt, &c.PaidAt,
	)
}

// CreateInput is the payload from the dashboard's "New claim" button.
type CreateInput struct {
	BrokerMC         string
	BrokerName       string
	LoadRef          string
	DwellHours       float64
	ClaimAmountCents int64
}

var (
	ErrInvalidInput = errors.New("claims: invalid input")
	ErrNotFound     = errors.New("claims: not found")
)

// Create inserts a `draft`-status claim and returns it. Ref is generated
// from the shared sequence (collisions across tenants don't matter —
// the unique index is on (tenant_id, ref)).
func Create(ctx context.Context, pool *pgxpool.Pool, in CreateInput) (*Claim, error) {
	tid, err := tenantIDFrom(ctx)
	if err != nil {
		return nil, err
	}
	mc := strings.TrimSpace(in.BrokerMC)
	if mc == "" {
		return nil, fmt.Errorf("%w: broker_mc required", ErrInvalidInput)
	}
	if in.DwellHours < 0 || in.DwellHours > 168 {
		return nil, fmt.Errorf("%w: dwell_hours out of range", ErrInvalidInput)
	}
	if in.ClaimAmountCents < 0 {
		return nil, fmt.Errorf("%w: claim_amount_cents must be >= 0", ErrInvalidInput)
	}

	var c Claim
	err = pgxdb.WithTenantTx(ctx, pool, func(tx pgx.Tx) error {
		var seq int64
		if err := tx.QueryRow(ctx, `SELECT nextval('claims_ref_seq')`).Scan(&seq); err != nil {
			return fmt.Errorf("nextval: %w", err)
		}
		ref := fmt.Sprintf("CLM-%04d", seq)

		return scanClaim(tx.QueryRow(ctx, `
			INSERT INTO claims
				(tenant_id, ref, broker_mc, broker_name, load_ref, dwell_hours, claim_amount_cents, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
			RETURNING `+claimColumns,
			tid, ref, mc, strings.TrimSpace(in.BrokerName),
			strings.TrimSpace(in.LoadRef), in.DwellHours, in.ClaimAmountCents,
		), &c)
	})
	if err != nil {
		return nil, fmt.Errorf("create claim: %w", err)
	}
	return &c, nil
}

// Draft fills in the AI-generated subject + body for a claim, calling
// the AI gateway when `AI_GATEWAY_URL` is set. Returns the updated row.
// Falls back to a deterministic template when AI is unreachable — the
// dispatcher can always edit before sending, so a low-quality draft is
// strictly better than a 5xx.
func Draft(ctx context.Context, pool *pgxpool.Pool, id uuid.UUID) (*Claim, error) {
	tid, err := tenantIDFrom(ctx)
	if err != nil {
		return nil, err
	}

	// Load existing claim to feed the AI prompt.
	var c Claim
	err = pgxdb.WithTenantTx(ctx, pool, func(tx pgx.Tx) error {
		return scanClaim(tx.QueryRow(ctx,
			`SELECT `+claimColumns+` FROM claims WHERE id = $1`, id), &c)
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	_ = tid // tenantctx already gates row visibility; tid here is for log

	subject, body, aiOK := draftViaAI(ctx, c)
	if !aiOK {
		subject, body = fallbackTemplate(c)
	}

	err = pgxdb.WithTenantTx(ctx, pool, func(tx pgx.Tx) error {
		return scanClaim(tx.QueryRow(ctx, `
			UPDATE claims SET
				drafted_subject = $1,
				drafted_body    = $2,
				ai_drafted      = $3,
				drafted_at      = now()
			WHERE id = $4
			RETURNING `+claimColumns,
			subject, body, aiOK, id), &c)
	})
	if err != nil {
		return nil, fmt.Errorf("update draft: %w", err)
	}
	return &c, nil
}

// MarkSent flips status from `draft` → `sent` and stamps sent_at.
func MarkSent(ctx context.Context, pool *pgxpool.Pool, id uuid.UUID) (*Claim, error) {
	return transition(ctx, pool, id, "sent", `
		UPDATE claims SET status = 'sent', sent_at = now()
		WHERE id = $1 AND status = 'draft'`)
}

// MarkPaid stamps recovery + paid_at, then fires-and-tracks a 18%
// success-fee invoice via the billing service. The invoice call is
// non-fatal: a billing degradation must NOT roll back the paid status
// (ops would rather see a missing invoice than a stuck-as-sent claim
// while real money has already landed).
func MarkPaid(ctx context.Context, pool *pgxpool.Pool, id uuid.UUID, recoveredCents int64) (*Claim, error) {
	if recoveredCents < 0 {
		return nil, fmt.Errorf("%w: recovered_cents must be >= 0", ErrInvalidInput)
	}
	tid, err := tenantIDFrom(ctx)
	if err != nil {
		return nil, err
	}
	var c Claim
	err = pgxdb.WithTenantTx(ctx, pool, func(tx pgx.Tx) error {
		return scanClaim(tx.QueryRow(ctx, `
			UPDATE claims SET
				status          = 'paid',
				recovered_cents = $1,
				paid_at         = now()
			WHERE id = $2 AND status IN ('sent','disputed')
			RETURNING `+claimColumns,
			recoveredCents, id), &c)
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	// Fire-and-track invoice. Skip when the row already has one (re-mark
	// idempotency: dispatcher fat-fingers MarkPaid twice in 5 min →
	// only one Stripe invoice should land).
	if c.SuccessFeeInvoiceID == "" && c.RecoveredCents > 0 {
		invoiceID, hostedURL, ok := createSuccessFeeInvoice(ctx, tid, c)
		if ok {
			_ = pgxdb.WithTenantTx(ctx, pool, func(tx pgx.Tx) error {
				return scanClaim(tx.QueryRow(ctx, `
					UPDATE claims SET
						success_fee_invoice_id = $1,
						success_fee_url        = $2
					WHERE id = $3
					RETURNING `+claimColumns,
					invoiceID, hostedURL, id), &c)
			})
		}
	}
	return &c, nil
}

// List returns every claim for the tenant, newest first. Pagination is
// a Sprint 5 concern; the dashboard renders all rows today.
func List(ctx context.Context, pool *pgxpool.Pool) ([]Claim, error) {
	var out []Claim
	err := pgxdb.WithTenantTx(ctx, pool, func(tx pgx.Tx) error {
		rows, err := tx.Query(ctx,
			`SELECT `+claimColumns+` FROM claims ORDER BY created_at DESC`)
		if err != nil {
			return err
		}
		defer rows.Close()
		for rows.Next() {
			var c Claim
			if err := scanClaim(rows, &c); err != nil {
				return err
			}
			out = append(out, c)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, fmt.Errorf("list claims: %w", err)
	}
	return out, nil
}

// transition is a shared helper for one-cell status flips that don't
// need extra columns updated (MarkSent today; deny/dispute later).
func transition(ctx context.Context, pool *pgxpool.Pool, id uuid.UUID, newStatus, query string) (*Claim, error) {
	tid, err := tenantIDFrom(ctx)
	if err != nil {
		return nil, err
	}
	_ = tid
	_ = newStatus
	err = pgxdb.WithTenantTx(ctx, pool, func(tx pgx.Tx) error {
		tag, err := tx.Exec(ctx, query, id)
		if err != nil {
			return err
		}
		if tag.RowsAffected() == 0 {
			return ErrNotFound
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	// Re-read so caller gets fresh row.
	var c Claim
	err = pgxdb.WithTenantTx(ctx, pool, func(tx pgx.Tx) error {
		return scanClaim(tx.QueryRow(ctx,
			`SELECT `+claimColumns+` FROM claims WHERE id = $1`, id), &c)
	})
	if err != nil {
		return nil, err
	}
	return &c, nil
}

// tenantIDFrom pulls the active tenant from the request context. The
// gateway populates X-Tenant-ID; the service's tenantHeaderMiddleware
// promotes that to tenantctx. Empty/missing → 401 at handler.
func tenantIDFrom(ctx context.Context) (uuid.UUID, error) {
	tc, err := tenantctx.From(ctx)
	if err != nil || tc.TenantID == uuid.Nil {
		return uuid.Nil, fmt.Errorf("no tenant context: %w", err)
	}
	return tc.TenantID, nil
}

// ── AI draft ────────────────────────────────────────────────────────

type aiResp struct {
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func draftViaAI(ctx context.Context, c Claim) (subject, body string, ok bool) {
	base := strings.TrimRight(os.Getenv("AI_GATEWAY_URL"), "/")
	if base == "" {
		return "", "", false
	}
	tid, _ := tenantIDFrom(ctx)
	req, err := json.Marshal(map[string]any{
		"broker_mc":              c.BrokerMC,
		"broker_name":            c.BrokerName,
		"load_ref":               c.LoadRef,
		"dwell_hours":            c.DwellHours,
		"claim_amount_cents":     c.ClaimAmountCents,
		"model":                  "claude-haiku-4-5",
		"ctx": map[string]any{
			"tenant_id": tid.String(),
		},
	})
	if err != nil {
		return "", "", false
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, base+"/v1/ai/draft-claim", strings.NewReader(string(req)))
	if err != nil {
		return "", "", false
	}
	httpReq.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 12 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		fmt.Fprintf(os.Stderr, "claims: AI gateway unreachable: %v\n", err)
		return "", "", false
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode >= 400 {
		fmt.Fprintf(os.Stderr, "claims: AI gateway returned %d\n", resp.StatusCode)
		return "", "", false
	}
	var out aiResp
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", "", false
	}
	if out.Subject == "" || out.Body == "" {
		return "", "", false
	}
	return out.Subject, out.Body, true
}

// ── Billing client (cluster-internal Connect-RPC over JSON) ─────────

// createSuccessFeeInvoice calls the billing service's
// `vettguard.v1.Billing/CreateSuccessFeeInvoice` Connect RPC over JSON.
// Returns `(invoice_id, hosted_url, ok)`. Failure is non-fatal — the
// caller never propagates the error so a billing degradation can't
// undo a successful paid-status flip.
func createSuccessFeeInvoice(ctx context.Context, tenantID uuid.UUID, c Claim) (invoiceID, hostedURL string, ok bool) {
	base := strings.TrimRight(os.Getenv("BILLING_SERVICE_URL"), "/")
	if base == "" {
		// Billing optional in dev — log and move on.
		fmt.Fprintf(os.Stderr, "claims: BILLING_SERVICE_URL unset; skipping success-fee invoice for %s\n", c.Ref)
		return "", "", false
	}
	body, err := json.Marshal(map[string]any{
		"tenantId":             tenantID.String(),
		"detentionClaimId":     c.ID.String(),
		"recoveredAmountCents": c.RecoveredCents,
		"description":          fmt.Sprintf("18%% success fee · %s · %s", c.Ref, c.BrokerName),
	})
	if err != nil {
		return "", "", false
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		base+"/vettguard.v1.Billing/CreateSuccessFeeInvoice",
		strings.NewReader(string(body)))
	if err != nil {
		return "", "", false
	}
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Fprintf(os.Stderr, "claims: billing unreachable: %v\n", err)
		return "", "", false
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode >= 400 {
		fmt.Fprintf(os.Stderr, "claims: billing returned %d for %s\n", resp.StatusCode, c.Ref)
		return "", "", false
	}
	var out struct {
		InvoiceID string `json:"invoiceId"`
		HostedURL string `json:"hostedUrl"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", "", false
	}
	if out.InvoiceID == "" {
		return "", "", false
	}
	return out.InvoiceID, out.HostedURL, true
}

// fallbackTemplate is what we send to the dispatcher when AI is offline.
// Plain, professional, US carrier-to-broker tone. The dispatcher can
// edit before sending.
func fallbackTemplate(c Claim) (subject, body string) {
	amount := fmt.Sprintf("$%.2f", float64(c.ClaimAmountCents)/100.0)
	loadRef := c.LoadRef
	if loadRef == "" {
		loadRef = "(load reference TBD)"
	}
	brokerName := c.BrokerName
	if brokerName == "" {
		brokerName = "Operations team"
	}
	subject = fmt.Sprintf("Detention invoice — %s · %s", c.Ref, loadRef)
	body = fmt.Sprintf(`Hello %s,

I'm writing to invoice detention charges from load %s.

  - Detention duration: %.1f hours past the standard 2-hour free window
  - Total detention charge: %s
  - Claim reference: %s (file under your remit-to records)

GPS arrival/departure records, signed BOL, and the rate confirmation's
detention terms are attached. Please remit to the carrier within your
standard payment cycle.

Reply directly to this email with any questions — VettGuard tracks the
thread on our side.

Thank you,
Dispatch team`,
		brokerName, loadRef, c.DwellHours, amount, c.Ref,
	)
	return subject, body
}
