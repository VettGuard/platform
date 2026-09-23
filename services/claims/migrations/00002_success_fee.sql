-- Success-fee invoice link on the claim row.
--
-- When MarkPaid runs, the claims service calls billing's
-- CreateSuccessFeeInvoice (18% of recovered_cents). We stash the
-- returned invoice id + Stripe-hosted URL here so the dashboard can
-- surface the link next to "Recovered: $X". Failure of the billing
-- call is non-fatal — the claim still flips to paid, ops follows up.

-- +goose Up
-- +goose StatementBegin
ALTER TABLE claims
  ADD COLUMN IF NOT EXISTS success_fee_invoice_id text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS success_fee_url        text NOT NULL DEFAULT '';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE claims
  DROP COLUMN IF EXISTS success_fee_invoice_id,
  DROP COLUMN IF EXISTS success_fee_url;
-- +goose StatementEnd
