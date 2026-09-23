// Package handler exposes the billing service over Connect-RPC.
package handler

import (
	"context"
	"errors"
	"io"
	"net/http"

	"connectrpc.com/connect"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
	"google.golang.org/protobuf/types/known/timestamppb"

	pb "github.com/vettguard/vettguard/packages/proto/gen/go"
	"github.com/vettguard/vettguard/packages/proto/gen/go/protov1connect"
	"github.com/vettguard/vettguard/services/billing/internal/stripeapi"
	"github.com/vettguard/vettguard/services/billing/internal/usecase"
)

var _ protov1connect.BillingHandler = (*Billing)(nil)

type Billing struct {
	Pool          *pgxpool.Pool
	Stripe        *stripeapi.Client
	WebhookSecret string
	Log           zerolog.Logger
}

func (h *Billing) UpsertCustomer(
	ctx context.Context,
	req *connect.Request[pb.UpsertCustomerRequest],
) (*connect.Response[pb.UpsertCustomerResponse], error) {
	tid, err := uuid.Parse(req.Msg.GetTenantId())
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("tenant_id must be uuid"))
	}
	id, err := usecase.UpsertCustomer(ctx, h.Pool, h.Stripe, tid, req.Msg.GetEmail(), req.Msg.GetName())
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&pb.UpsertCustomerResponse{StripeCustomerId: id}), nil
}

func (h *Billing) CreateSubscription(
	ctx context.Context,
	req *connect.Request[pb.CreateSubscriptionRequest],
) (*connect.Response[pb.CreateSubscriptionResponse], error) {
	tid, err := uuid.Parse(req.Msg.GetTenantId())
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("tenant_id must be uuid"))
	}
	view, err := usecase.CreateSubscription(ctx, h.Pool, h.Stripe, tid, req.Msg.GetTrial())
	if err != nil {
		return nil, mapErr(err)
	}
	return connect.NewResponse(&pb.CreateSubscriptionResponse{
		Subscription: subscriptionToProto(tid, view),
		ClientSecret: view.ClientSecret,
	}), nil
}

func (h *Billing) CancelSubscription(
	ctx context.Context,
	req *connect.Request[pb.CancelSubscriptionRequest],
) (*connect.Response[pb.CancelSubscriptionResponse], error) {
	tid, err := uuid.Parse(req.Msg.GetTenantId())
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("tenant_id must be uuid"))
	}
	view, err := usecase.CancelSubscription(ctx, h.Pool, h.Stripe, tid, req.Msg.GetAtPeriodEnd())
	if err != nil {
		return nil, mapErr(err)
	}
	return connect.NewResponse(&pb.CancelSubscriptionResponse{
		Subscription: subscriptionToProto(tid, view),
	}), nil
}

func (h *Billing) GetCustomerPortalURL(
	ctx context.Context,
	req *connect.Request[pb.GetCustomerPortalURLRequest],
) (*connect.Response[pb.GetCustomerPortalURLResponse], error) {
	tid, err := uuid.Parse(req.Msg.GetTenantId())
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("tenant_id must be uuid"))
	}
	url, err := usecase.PortalURL(ctx, h.Pool, h.Stripe, tid, req.Msg.GetReturnUrl())
	if err != nil {
		return nil, mapErr(err)
	}
	return connect.NewResponse(&pb.GetCustomerPortalURLResponse{Url: url}), nil
}

func (h *Billing) CreateSuccessFeeInvoice(
	ctx context.Context,
	req *connect.Request[pb.CreateSuccessFeeInvoiceRequest],
) (*connect.Response[pb.CreateSuccessFeeInvoiceResponse], error) {
	tid, err := uuid.Parse(req.Msg.GetTenantId())
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("tenant_id must be uuid"))
	}
	cid, err := uuid.Parse(req.Msg.GetDetentionClaimId())
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("detention_claim_id must be uuid"))
	}
	out, err := usecase.CreateSuccessFeeInvoice(
		ctx, h.Pool, h.Stripe, tid, cid,
		req.Msg.GetRecoveredAmountCents(), req.Msg.GetDescription(),
	)
	if err != nil {
		return nil, mapErr(err)
	}
	return connect.NewResponse(&pb.CreateSuccessFeeInvoiceResponse{
		InvoiceId: out.StripeInvoiceID,
		HostedUrl: out.HostedURL,
	}), nil
}

// HandleStripeWebhook is exposed over Connect-RPC for completeness, but the
// real Stripe webhook endpoint is the plain HTTP handler below — Stripe
// posts raw JSON with a signature, not Connect frames.
func (h *Billing) HandleStripeWebhook(
	context.Context,
	*connect.Request[pb.StripeWebhookEvent],
) (*connect.Response[pb.StripeWebhookAck], error) {
	return nil, connect.NewError(connect.CodeUnimplemented,
		errors.New("use POST /v1/billing/stripe/webhook for real Stripe deliveries"))
}

// StripeWebhookHTTP is the plain HTTP handler Stripe POSTs to. It verifies
// the signature, dedups events, and dispatches. Returns 200 on duplicate
// (acks Stripe so it stops retrying) and on success.
func (h *Billing) StripeWebhookHTTP(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 1<<20))
	if err != nil {
		h.Log.Warn().Err(err).Msg("stripe webhook: read body")
		http.Error(w, "read body", http.StatusBadRequest)
		return
	}
	sig := r.Header.Get("Stripe-Signature")
	ev, err := usecase.ConstructEvent(body, sig, h.WebhookSecret)
	if err != nil {
		h.Log.Warn().Err(err).Msg("stripe webhook: signature")
		http.Error(w, "invalid signature", http.StatusBadRequest)
		return
	}
	switch err := usecase.ProcessEvent(r.Context(), h.Pool, ev); {
	case err == nil, errors.Is(err, usecase.ErrEventReplay):
		w.WriteHeader(http.StatusOK)
	default:
		h.Log.Error().Err(err).Str("event_id", ev.ID).Str("type", string(ev.Type)).Msg("stripe webhook: process")
		// 500 → Stripe will retry. Keep idempotent.
		http.Error(w, "process failed", http.StatusInternalServerError)
	}
}

func subscriptionToProto(tenantID uuid.UUID, v usecase.SubscriptionView) *pb.Subscription {
	s := &pb.Subscription{
		Id:       v.StripeSubscriptionID,
		TenantId: tenantID.String(),
		Plan:     pb.Plan_PLAN_VETTING_BASE,
		Status:   v.Status,
	}
	if v.CurrentPeriodEnd.Valid {
		s.CurrentPeriodEnd = timestamppb.New(v.CurrentPeriodEnd.Time)
	}
	return s
}

func mapErr(err error) error {
	switch {
	case errors.Is(err, usecase.ErrCustomerMissing):
		return connect.NewError(connect.CodeFailedPrecondition, err)
	case errors.Is(err, usecase.ErrSubMissing):
		return connect.NewError(connect.CodeNotFound, err)
	default:
		return connect.NewError(connect.CodeInternal, err)
	}
}
