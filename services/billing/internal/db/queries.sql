-- ─── stripe_customers ───────────────────────────────────────────────────────

-- name: UpsertStripeCustomer :one
INSERT INTO stripe_customers (stripe_customer_id, tenant_id, email)
VALUES ($1, $2, $3)
ON CONFLICT (tenant_id) DO UPDATE
  SET email = EXCLUDED.email
  RETURNING *;

-- name: GetStripeCustomerByTenant :one
SELECT * FROM stripe_customers WHERE tenant_id = $1;

-- name: GetTenantByStripeCustomer :one
SELECT tenant_id FROM stripe_customers WHERE stripe_customer_id = $1;

-- ─── subscriptions ──────────────────────────────────────────────────────────

-- name: UpsertSubscription :one
INSERT INTO subscriptions (
  tenant_id, stripe_customer_id, stripe_subscription_id, plan, status,
  current_period_end, cancel_at_period_end
) VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (tenant_id) DO UPDATE
  SET stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      plan                  = EXCLUDED.plan,
      status                = EXCLUDED.status,
      current_period_end    = EXCLUDED.current_period_end,
      cancel_at_period_end  = EXCLUDED.cancel_at_period_end,
      updated_at            = now()
  RETURNING *;

-- name: GetSubscriptionByTenant :one
SELECT * FROM subscriptions WHERE tenant_id = $1;

-- name: UpdateSubscriptionStatus :exec
UPDATE subscriptions
  SET status = $2,
      current_period_end = $3,
      cancel_at_period_end = $4,
      updated_at = now()
  WHERE stripe_subscription_id = $1;

-- ─── success_fee_invoices ───────────────────────────────────────────────────

-- name: CreateSuccessFeeInvoice :one
INSERT INTO success_fee_invoices (
  tenant_id, detention_claim_id, stripe_customer_id, stripe_invoice_id,
  recovered_amount_cents, fee_amount_cents, status, hosted_url
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: MarkSuccessFeeInvoicePaid :exec
UPDATE success_fee_invoices
  SET status = 'paid', paid_at = now()
  WHERE stripe_invoice_id = $1;

-- name: UpdateSuccessFeeInvoiceStatus :exec
UPDATE success_fee_invoices SET status = $2 WHERE stripe_invoice_id = $1;

-- ─── stripe_events (webhook dedup) ──────────────────────────────────────────

-- name: ClaimStripeEvent :one
-- Inserts an event row. ON CONFLICT no-op means we've seen this event_id
-- before — the caller skips re-processing.
INSERT INTO stripe_events (event_id, event_type)
VALUES ($1, $2)
ON CONFLICT (event_id) DO NOTHING
RETURNING *;

-- name: MarkStripeEventProcessed :exec
UPDATE stripe_events SET processed_at = now() WHERE event_id = $1;
