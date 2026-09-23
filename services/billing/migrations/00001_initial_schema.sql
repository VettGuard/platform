-- +goose Up
-- +goose StatementBegin

-- Tracks Stripe Subscriptions by tenant. tenant_id is unique because we
-- support a single active subscription per tenant (VETTING_BASE today).
-- Future multi-product world: drop the unique, add a product column.
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL UNIQUE,
  stripe_customer_id    TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  plan                  TEXT NOT NULL,                -- 'vetting_base'
  status                TEXT NOT NULL,                -- active | past_due | canceled | trialing | incomplete
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX subscriptions_customer_idx ON subscriptions (stripe_customer_id);

-- Detention success-fee invoices (18%). One row per Stripe invoice.
CREATE TABLE success_fee_invoices (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL,
  detention_claim_id     UUID NOT NULL,
  stripe_customer_id     TEXT NOT NULL,
  stripe_invoice_id      TEXT NOT NULL UNIQUE,
  recovered_amount_cents BIGINT NOT NULL CHECK (recovered_amount_cents >= 0),
  fee_amount_cents       BIGINT NOT NULL CHECK (fee_amount_cents >= 0),
  status                 TEXT NOT NULL,                -- draft | open | paid | void | uncollectible
  hosted_url             TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at                TIMESTAMPTZ
);

CREATE INDEX success_fee_invoices_tenant_idx ON success_fee_invoices (tenant_id);
CREATE INDEX success_fee_invoices_claim_idx  ON success_fee_invoices (detention_claim_id);

-- Webhook dedup: every Stripe event lands here exactly once. Idempotency
-- key for at-least-once delivery from Stripe's side.
CREATE TABLE stripe_events (
  event_id    TEXT PRIMARY KEY,                       -- evt_xxx
  event_type  TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Mapping from Stripe customer → tenant. Filled the first time we create
-- a customer; used by webhook handlers to resolve tenant from stripe id.
CREATE TABLE stripe_customers (
  stripe_customer_id TEXT PRIMARY KEY,
  tenant_id          UUID NOT NULL UNIQUE,
  email              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS stripe_customers;
DROP TABLE IF EXISTS stripe_events;
DROP TABLE IF EXISTS success_fee_invoices;
DROP TABLE IF EXISTS subscriptions;
-- +goose StatementEnd
