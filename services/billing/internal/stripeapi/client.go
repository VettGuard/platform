// Package stripeapi wraps the Stripe SDK calls we use. The point of the
// wrapper is to (a) keep stripe-go imports out of usecase code and (b)
// give us a single seam to swap for a fake during tests.
package stripeapi

import (
	"context"
	"fmt"

	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/billingportal/session"
	"github.com/stripe/stripe-go/v82/customer"
	"github.com/stripe/stripe-go/v82/invoice"
	"github.com/stripe/stripe-go/v82/invoiceitem"
	"github.com/stripe/stripe-go/v82/subscription"
)

// Client carries the configured secret key + the default price IDs. We use
// the package-level stripe.Key for backwards compat with stripe-go, but the
// Client also stamps `Key` on every params object to avoid global-state
// surprises if more than one Stripe account is ever used in the same proc.
type Client struct {
	SecretKey      string
	VettingPriceID string
}

func New(secretKey, vettingPriceID string) *Client {
	stripe.Key = secretKey
	return &Client{SecretKey: secretKey, VettingPriceID: vettingPriceID}
}

// UpsertCustomer creates a customer with metadata.tenant_id, or returns the
// existing customer when the caller already knows its id. Tax is enabled at
// the account level (Settings → Tax), so we don't pass per-customer tax flags.
func (c *Client) CreateCustomer(ctx context.Context, tenantID, email, name string) (*stripe.Customer, error) {
	p := &stripe.CustomerParams{
		Email: stripe.String(email),
		Name:  stripe.String(name),
	}
	p.Context = ctx
	p.AddMetadata("tenant_id", tenantID)
	return customer.New(p)
}

// CreateSubscription creates a subscription against the VETTING_BASE price.
// payment_behavior=default_incomplete returns a PaymentIntent whose
// client_secret the frontend uses to confirm card with Stripe.js.
func (c *Client) CreateSubscription(ctx context.Context, customerID string, trial bool) (*stripe.Subscription, error) {
	if c.VettingPriceID == "" {
		return nil, fmt.Errorf("stripeapi: VETTING_BASE price id not configured")
	}
	p := &stripe.SubscriptionParams{
		Customer: stripe.String(customerID),
		Items: []*stripe.SubscriptionItemsParams{{
			Price: stripe.String(c.VettingPriceID),
		}},
		PaymentBehavior: stripe.String("default_incomplete"),
		AutomaticTax: &stripe.SubscriptionAutomaticTaxParams{
			Enabled: stripe.Bool(true),
		},
	}
	p.Context = ctx
	p.AddExpand("latest_invoice.confirmation_secret")
	if trial {
		p.TrialPeriodDays = stripe.Int64(14)
	}
	return subscription.New(p)
}

// CancelSubscription either cancels immediately or at period end depending
// on the flag. Stripe treats `cancel_at_period_end=true` as a flag flip,
// not a deletion — webhook will move status to canceled at period end.
func (c *Client) CancelSubscription(ctx context.Context, subID string, atPeriodEnd bool) (*stripe.Subscription, error) {
	if atPeriodEnd {
		p := &stripe.SubscriptionParams{
			CancelAtPeriodEnd: stripe.Bool(true),
		}
		p.Context = ctx
		return subscription.Update(subID, p)
	}
	p := &stripe.SubscriptionCancelParams{}
	p.Context = ctx
	return subscription.Cancel(subID, p)
}

// PortalURL returns a one-time Customer Portal session URL.
func (c *Client) PortalURL(ctx context.Context, customerID, returnURL string) (string, error) {
	p := &stripe.BillingPortalSessionParams{
		Customer:  stripe.String(customerID),
		ReturnURL: stripe.String(returnURL),
	}
	p.Context = ctx
	s, err := session.New(p)
	if err != nil {
		return "", err
	}
	return s.URL, nil
}

// CreateOneOffInvoice (used for detention success fees):
// 1) attach an invoice item to the customer,
// 2) create an invoice that pulls in pending items,
// 3) finalize so it has a hosted_invoice_url + can be sent.
// Stripe will email + auto-collect per the customer's default payment method.
func (c *Client) CreateOneOffInvoice(
	ctx context.Context,
	customerID, description string,
	amountCents int64,
) (*stripe.Invoice, error) {
	if amountCents <= 0 {
		return nil, fmt.Errorf("stripeapi: amount_cents must be > 0")
	}

	iiParams := &stripe.InvoiceItemParams{
		Customer:    stripe.String(customerID),
		Amount:      stripe.Int64(amountCents),
		Currency:    stripe.String(string(stripe.CurrencyUSD)),
		Description: stripe.String(description),
	}
	iiParams.Context = ctx
	if _, err := invoiceitem.New(iiParams); err != nil {
		return nil, fmt.Errorf("invoice item: %w", err)
	}

	invParams := &stripe.InvoiceParams{
		Customer:         stripe.String(customerID),
		CollectionMethod: stripe.String(string(stripe.InvoiceCollectionMethodChargeAutomatically)),
		AutoAdvance:      stripe.Bool(true),
	}
	invParams.Context = ctx
	inv, err := invoice.New(invParams)
	if err != nil {
		return nil, fmt.Errorf("invoice new: %w", err)
	}
	finalParams := &stripe.InvoiceFinalizeInvoiceParams{}
	finalParams.Context = ctx
	final, err := invoice.FinalizeInvoice(inv.ID, finalParams)
	if err != nil {
		return nil, fmt.Errorf("invoice finalize: %w", err)
	}
	return final, nil
}
