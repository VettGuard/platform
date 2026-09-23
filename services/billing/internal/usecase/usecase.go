// Package usecase implements billing business logic: Stripe customer/subscription
// upserts, customer portal links, success-fee invoices, and webhook event
// handling. The Stripe SDK is kept behind `stripeapi.Client` so this layer
// stays testable.
package usecase

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vettguard/vettguard/services/billing/internal/db"
	"github.com/vettguard/vettguard/services/billing/internal/stripeapi"
	"github.com/vettguard/vettguard/services/shared/pkg/pgxdb"
)

// PlanVettingBase is the only paid plan in Sprint 2 ($199/mo). Keep names
// in sync with the proto enum and Stripe Price metadata.
const PlanVettingBase = "vetting_base"

// SuccessFeeRate — 18% of recovered detention amount.
const SuccessFeeRate = 0.18

// Domain errors.
var (
	ErrCustomerMissing = errors.New("billing: stripe customer not found for tenant")
	ErrSubMissing      = errors.New("billing: subscription not found for tenant")
)

// UpsertCustomer creates (or returns) a Stripe customer for tenantID and
// caches the mapping locally. Idempotent: calling twice with the same tenant
// returns the same stripe customer id.
func UpsertCustomer(
	ctx context.Context,
	pool *pgxpool.Pool,
	sc *stripeapi.Client,
	tenantID uuid.UUID,
	email, name string,
) (string, error) {
	// 1. Already mapped?
	var cached string
	_ = pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		c, err := q.GetStripeCustomerByTenant(ctx, tenantID)
		if err == nil {
			cached = c.StripeCustomerID
		}
		return nil
	})
	if cached != "" {
		return cached, nil
	}

	// 2. Create with Stripe.
	cust, err := sc.CreateCustomer(ctx, tenantID.String(), email, name)
	if err != nil {
		return "", fmt.Errorf("stripe create customer: %w", err)
	}

	// 3. Persist mapping.
	err = pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		_, err := q.UpsertStripeCustomer(ctx, db.UpsertStripeCustomerParams{
			StripeCustomerID: cust.ID,
			TenantID:         tenantID,
			Email:            pgxText(email),
		})
		return err
	})
	if err != nil {
		return "", fmt.Errorf("persist customer: %w", err)
	}
	return cust.ID, nil
}

// CreateSubscription mints a VETTING_BASE subscription for the tenant. The
// returned client_secret is what the dashboard hands to Stripe.js to confirm
// the payment method.
type SubscriptionView struct {
	StripeSubscriptionID string
	Status               string
	CurrentPeriodEnd     pgtype.Timestamptz
	ClientSecret         string
}

func CreateSubscription(
	ctx context.Context,
	pool *pgxpool.Pool,
	sc *stripeapi.Client,
	tenantID uuid.UUID,
	trial bool,
) (SubscriptionView, error) {
	var customerID string
	err := pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		c, err := q.GetStripeCustomerByTenant(ctx, tenantID)
		if err != nil {
			return ErrCustomerMissing
		}
		customerID = c.StripeCustomerID
		return nil
	})
	if err != nil {
		return SubscriptionView{}, err
	}

	sub, err := sc.CreateSubscription(ctx, customerID, trial)
	if err != nil {
		return SubscriptionView{}, fmt.Errorf("stripe subscription: %w", err)
	}

	periodEnd := pgtype.Timestamptz{}
	// The latest period end is on the first subscription item in stripe-go v82+.
	if len(sub.Items.Data) > 0 && sub.Items.Data[0].CurrentPeriodEnd > 0 {
		periodEnd = pgxUnix(sub.Items.Data[0].CurrentPeriodEnd)
	}

	err = pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		_, err := q.UpsertSubscription(ctx, db.UpsertSubscriptionParams{
			TenantID:             tenantID,
			StripeCustomerID:     customerID,
			StripeSubscriptionID: sub.ID,
			Plan:                 PlanVettingBase,
			Status:               string(sub.Status),
			CurrentPeriodEnd:     periodEnd,
			CancelAtPeriodEnd:    sub.CancelAtPeriodEnd,
		})
		return err
	})
	if err != nil {
		return SubscriptionView{}, fmt.Errorf("persist subscription: %w", err)
	}

	out := SubscriptionView{
		StripeSubscriptionID: sub.ID,
		Status:               string(sub.Status),
		CurrentPeriodEnd:     periodEnd,
	}
	if sub.LatestInvoice != nil && sub.LatestInvoice.ConfirmationSecret != nil {
		out.ClientSecret = sub.LatestInvoice.ConfirmationSecret.ClientSecret
	}
	return out, nil
}

func CancelSubscription(
	ctx context.Context,
	pool *pgxpool.Pool,
	sc *stripeapi.Client,
	tenantID uuid.UUID,
	atPeriodEnd bool,
) (SubscriptionView, error) {
	var subID string
	err := pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		s, err := q.GetSubscriptionByTenant(ctx, tenantID)
		if err != nil {
			return ErrSubMissing
		}
		subID = s.StripeSubscriptionID
		return nil
	})
	if err != nil {
		return SubscriptionView{}, err
	}
	sub, err := sc.CancelSubscription(ctx, subID, atPeriodEnd)
	if err != nil {
		return SubscriptionView{}, fmt.Errorf("stripe cancel: %w", err)
	}
	periodEnd := pgtype.Timestamptz{}
	if len(sub.Items.Data) > 0 && sub.Items.Data[0].CurrentPeriodEnd > 0 {
		periodEnd = pgxUnix(sub.Items.Data[0].CurrentPeriodEnd)
	}
	_ = pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		return q.UpdateSubscriptionStatus(ctx, db.UpdateSubscriptionStatusParams{
			StripeSubscriptionID: sub.ID,
			Status:               string(sub.Status),
			CurrentPeriodEnd:     periodEnd,
			CancelAtPeriodEnd:    sub.CancelAtPeriodEnd,
		})
	})
	return SubscriptionView{
		StripeSubscriptionID: sub.ID,
		Status:               string(sub.Status),
		CurrentPeriodEnd:     periodEnd,
	}, nil
}

func PortalURL(
	ctx context.Context,
	pool *pgxpool.Pool,
	sc *stripeapi.Client,
	tenantID uuid.UUID,
	returnURL string,
) (string, error) {
	var customerID string
	err := pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		c, err := q.GetStripeCustomerByTenant(ctx, tenantID)
		if err != nil {
			return ErrCustomerMissing
		}
		customerID = c.StripeCustomerID
		return nil
	})
	if err != nil {
		return "", err
	}
	return sc.PortalURL(ctx, customerID, returnURL)
}

// CreateSuccessFeeInvoice computes 18% of recoveredCents and bills it via
// Stripe one-off invoice. Persists the local row keyed by stripe_invoice_id.
type SuccessFeeView struct {
	StripeInvoiceID string
	HostedURL       string
	FeeAmountCents  int64
}

func CreateSuccessFeeInvoice(
	ctx context.Context,
	pool *pgxpool.Pool,
	sc *stripeapi.Client,
	tenantID, detentionClaimID uuid.UUID,
	recoveredCents int64,
	description string,
) (SuccessFeeView, error) {
	if recoveredCents <= 0 {
		return SuccessFeeView{}, errors.New("billing: recovered amount must be > 0")
	}
	fee := int64(float64(recoveredCents) * SuccessFeeRate)
	if fee <= 0 {
		fee = 1 // minimum charge guard
	}

	var customerID string
	err := pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		c, err := q.GetStripeCustomerByTenant(ctx, tenantID)
		if err != nil {
			return ErrCustomerMissing
		}
		customerID = c.StripeCustomerID
		return nil
	})
	if err != nil {
		return SuccessFeeView{}, err
	}

	if description == "" {
		description = fmt.Sprintf("VettGuard detention recovery fee (18%% of $%.2f)", float64(recoveredCents)/100)
	}
	inv, err := sc.CreateOneOffInvoice(ctx, customerID, description, fee)
	if err != nil {
		return SuccessFeeView{}, err
	}

	err = pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		_, err := q.CreateSuccessFeeInvoice(ctx, db.CreateSuccessFeeInvoiceParams{
			TenantID:             tenantID,
			DetentionClaimID:     detentionClaimID,
			StripeCustomerID:     customerID,
			StripeInvoiceID:      inv.ID,
			RecoveredAmountCents: recoveredCents,
			FeeAmountCents:       fee,
			Status:               string(inv.Status),
			HostedUrl:            pgxText(inv.HostedInvoiceURL),
		})
		return err
	})
	if err != nil {
		return SuccessFeeView{}, fmt.Errorf("persist success fee: %w", err)
	}

	return SuccessFeeView{
		StripeInvoiceID: inv.ID,
		HostedURL:       inv.HostedInvoiceURL,
		FeeAmountCents:  fee,
	}, nil
}

// pgxText wraps a string for nullable text columns. Empty → SQL NULL.
func pgxText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: s, Valid: true}
}

func pgxUnix(epochSec int64) pgtype.Timestamptz {
	if epochSec == 0 {
		return pgtype.Timestamptz{}
	}
	return pgtype.Timestamptz{Time: pgUnixTime(epochSec), Valid: true}
}
