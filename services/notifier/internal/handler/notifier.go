// Package handler exposes the notifier service over Connect-RPC + plain
// HTTP for the Postmark inbound webhook.
package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"connectrpc.com/connect"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"

	pb "github.com/vettguard/vettguard/packages/proto/gen/go"
	"github.com/vettguard/vettguard/packages/proto/gen/go/protov1connect"
	"github.com/vettguard/vettguard/services/notifier/internal/postmark"
	"github.com/vettguard/vettguard/services/notifier/internal/usecase"
)

var _ protov1connect.NotifierHandler = (*Notifier)(nil)

type Notifier struct {
	Pool     *pgxpool.Pool
	Postmark *postmark.Client
	Log      zerolog.Logger
}

func (h *Notifier) SendEmail(
	ctx context.Context,
	req *connect.Request[pb.SendEmailRequest],
) (*connect.Response[pb.SendEmailResponse], error) {
	out, err := usecase.SendEmail(ctx, h.Pool, h.Postmark, usecase.SendEmailInput{
		TenantID:       req.Msg.GetTenantId(),
		To:             req.Msg.GetToAddress(),
		Template:       req.Msg.GetTemplate(),
		Vars:           req.Msg.GetVars(),
		IdempotencyKey: req.Msg.GetIdempotencyKey(),
	})
	if err != nil {
		return nil, mapErr(err)
	}
	return connect.NewResponse(&pb.SendEmailResponse{
		MessageId: out.MessageID,
		Deduped:   out.Deduped,
	}), nil
}

func (h *Notifier) SendSMS(
	context.Context,
	*connect.Request[pb.SendSMSRequest],
) (*connect.Response[pb.SendSMSResponse], error) {
	// Twilio integration lands when Phase 2 needs dispatcher SMS alerts.
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("SendSMS: Twilio wiring deferred to Phase 2"))
}

// PostmarkWebhookHTTP receives Postmark delivery + bounce + complaint
// events. The endpoint must be added under Postmark's Server settings.
// Doc: https://postmarkapp.com/developer/webhooks/webhooks-overview
func (h *Notifier) PostmarkWebhookHTTP(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 1<<20))
	if err != nil {
		http.Error(w, "read body", http.StatusBadRequest)
		return
	}
	var ev struct {
		RecordType   string `json:"RecordType"` // Delivery | Bounce | SpamComplaint | Open | ...
		MessageID    string `json:"MessageID"`
		Email        string `json:"Email"`
		Recipient    string `json:"Recipient"`
		Type         string `json:"Type"`        // HardBounce | Transient | ...
		TypeCode     int    `json:"TypeCode"`
		Description  string `json:"Description"`
		Details      string `json:"Details"`
	}
	if err := json.Unmarshal(body, &ev); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	to := ev.Email
	if to == "" {
		to = ev.Recipient
	}
	switch ev.RecordType {
	case "Bounce":
		if ev.Type == "HardBounce" {
			_ = usecase.RecordSuppression(r.Context(), h.Pool, to, "hard_bounce", "postmark")
		}
		_ = usecase.MarkProviderStatus(r.Context(), h.Pool, ev.MessageID, "bounced", ev.Description)
	case "SpamComplaint":
		_ = usecase.RecordSuppression(r.Context(), h.Pool, to, "complaint", "postmark")
		_ = usecase.MarkProviderStatus(r.Context(), h.Pool, ev.MessageID, "complained", "")
	case "Delivery":
		// Already 'sent' at insert; no-op.
	default:
		h.Log.Debug().Str("record_type", ev.RecordType).Msg("postmark webhook: ignored")
	}
	w.WriteHeader(http.StatusOK)
}

func mapErr(err error) error {
	switch {
	case errors.Is(err, usecase.ErrMissingIdemKey):
		return connect.NewError(connect.CodeInvalidArgument, err)
	case errors.Is(err, usecase.ErrSuppressed):
		return connect.NewError(connect.CodeFailedPrecondition, err)
	default:
		return connect.NewError(connect.CodeInternal, err)
	}
}
