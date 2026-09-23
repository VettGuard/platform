package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/webhook"

	"github.com/vettguard/vettguard/services/billing/internal/db"
	"github.com/vettguard/vettguard/services/shared/pkg/pgxdb"
)

// ErrEventReplay is returned when a webhook event_id has already been
// processed — the caller acks 200 without re-running side effects.
var ErrEventReplay = errors.New("billing: event already processed")

// ConstructEvent verifies Stripe's signature and parses the event. Caller
// passes the raw body + Stripe-Signature header value. webhookSecret is
// loaded from `STRIPE_WEBHOOK_SECRET`.
func ConstructEvent(rawBody []byte, signature, webhookSecret string) (stripe.Event, error) {
	return webhook.ConstructEvent(rawBody, signature, webhookSecret)
}

// ProcessEvent dispatches one stripe.Event to its handler. Idempotent via
// `stripe_events` table — replays return ErrEventReplay.
func ProcessEvent(ctx context.Context, pool *pgxpool.Pool, ev stripe.Event) error {
	// Claim the event_id. If the insert is a no-op, someone got here first.
	claimed := false
	err := pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		_, err := q.ClaimStripeEvent(ctx, db.ClaimStripeEventParams{
			EventID:   ev.ID,
			EventType: string(ev.Type),
		})
		if err == nil {
			claimed = true
			return nil
		}
		if errors.Is(err, pgx.ErrNoRows) {
			// ON CONFLICT DO NOTHING with RETURNING → no row, ErrNoRows.
			return nil
		}
		return err
	})
	if err != nil {
		return fmt.Errorf("claim event: %w", err)
	}
	if !claimed {
		return ErrEventReplay
	}

	switch ev.Type {
	case "customer.subscription.created",
		"customer.subscription.updated",
		"customer.subscription.deleted":
		err = handleSubscriptionEvent(ctx, pool, ev)
	case "invoice.payment_succeeded":
		err = handleInvoicePaid(ctx, pool, ev)
	case "invoice.payment_failed":
		err = handleInvoiceFailed(ctx, pool, ev)
	default:
		// Unhandled — still mark processed so we don't loop. Stripe will
		// keep sending until we 200.
		err = nil
	}
	if err != nil {
		return err
	}
	return pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		return db.New(tx).MarkStripeEventProcessed(ctx, ev.ID)
	})
}

func handleSubscriptionEvent(ctx context.Context, pool *pgxpool.Pool, ev stripe.Event) error {
	var sub stripe.Subscription
	if err := json.Unmarshal(ev.Data.Raw, &sub); err != nil {
		return fmt.Errorf("decode subscription: %w", err)
	}
	periodEnd := pgxUnix(0)
	if len(sub.Items.Data) > 0 && sub.Items.Data[0].CurrentPeriodEnd > 0 {
		periodEnd = pgxUnix(sub.Items.Data[0].CurrentPeriodEnd)
	}
	return pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		return db.New(tx).UpdateSubscriptionStatus(ctx, db.UpdateSubscriptionStatusParams{
			StripeSubscriptionID: sub.ID,
			Status:               string(sub.Status),
			CurrentPeriodEnd:     periodEnd,
			CancelAtPeriodEnd:    sub.CancelAtPeriodEnd,
		})
	})
}

func handleInvoicePaid(ctx context.Context, pool *pgxpool.Pool, ev stripe.Event) error {
	var inv stripe.Invoice
	if err := json.Unmarshal(ev.Data.Raw, &inv); err != nil {
		return fmt.Errorf("decode invoice: %w", err)
	}
	return pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		// Success-fee path. Subscription invoices are reflected in the
		// subscription status, not in success_fee_invoices.
		return db.New(tx).MarkSuccessFeeInvoicePaid(ctx, inv.ID)
	})
}

func handleInvoiceFailed(ctx context.Context, pool *pgxpool.Pool, ev stripe.Event) error {
	var inv stripe.Invoice
	if err := json.Unmarshal(ev.Data.Raw, &inv); err != nil {
		return fmt.Errorf("decode invoice: %w", err)
	}
	return pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		return db.New(tx).UpdateSuccessFeeInvoiceStatus(ctx, db.UpdateSuccessFeeInvoiceStatusParams{
			StripeInvoiceID: inv.ID,
			Status:          "uncollectible",
		})
	})
}
