// Package handler exposes the claims usecases over plain HTTP/JSON.
// Same shape as services/brokers — Connect-RPC overhead isn't worth it
// for CRUD over a small surface area.
package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"

	"github.com/vettguard/vettguard/services/claims/internal/usecase"
)

type Claims struct {
	Pool *pgxpool.Pool
	Log  zerolog.Logger
}

// Mount registers the claims routes on r. Caller wraps with the
// tenantctx middleware (gateway + service main do this together).
func (h *Claims) Mount(r chi.Router) {
	r.Get("/v1/claims", h.list)
	r.Post("/v1/claims", h.create)
	r.Post("/v1/claims/{id}/draft", h.draft)
	r.Post("/v1/claims/{id}/send", h.send)
	r.Post("/v1/claims/{id}/paid", h.paid)
}

func (h *Claims) list(w http.ResponseWriter, r *http.Request) {
	out, err := usecase.List(r.Context(), h.Pool)
	if err != nil {
		h.Log.Error().Err(err).Msg("list claims")
		httpErr(w, http.StatusInternalServerError, "list failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"claims": claimsJSON(out)})
}

func (h *Claims) create(w http.ResponseWriter, r *http.Request) {
	var body struct {
		BrokerMC         string  `json:"brokerMc"`
		BrokerName       string  `json:"brokerName"`
		LoadRef          string  `json:"loadRef"`
		DwellHours       float64 `json:"dwellHours"`
		ClaimAmountCents int64   `json:"claimAmountCents"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httpErr(w, http.StatusBadRequest, "invalid json")
		return
	}
	c, err := usecase.Create(r.Context(), h.Pool, usecase.CreateInput{
		BrokerMC: body.BrokerMC, BrokerName: body.BrokerName, LoadRef: body.LoadRef,
		DwellHours: body.DwellHours, ClaimAmountCents: body.ClaimAmountCents,
	})
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidInput) {
			httpErr(w, http.StatusBadRequest, err.Error())
			return
		}
		h.Log.Error().Err(err).Msg("create claim")
		httpErr(w, http.StatusInternalServerError, "create failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"claim": claimJSON(*c)})
}

func (h *Claims) draft(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpErr(w, http.StatusBadRequest, "invalid id")
		return
	}
	c, err := usecase.Draft(r.Context(), h.Pool, id)
	if err != nil {
		if errors.Is(err, usecase.ErrNotFound) {
			httpErr(w, http.StatusNotFound, "claim not found")
			return
		}
		h.Log.Error().Err(err).Str("id", id.String()).Msg("draft claim")
		httpErr(w, http.StatusInternalServerError, "draft failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"claim": claimJSON(*c)})
}

func (h *Claims) send(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpErr(w, http.StatusBadRequest, "invalid id")
		return
	}
	c, err := usecase.MarkSent(r.Context(), h.Pool, id)
	if err != nil {
		if errors.Is(err, usecase.ErrNotFound) {
			httpErr(w, http.StatusNotFound, "claim not found or not in draft state")
			return
		}
		h.Log.Error().Err(err).Str("id", id.String()).Msg("send claim")
		httpErr(w, http.StatusInternalServerError, "send failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"claim": claimJSON(*c)})
}

func (h *Claims) paid(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpErr(w, http.StatusBadRequest, "invalid id")
		return
	}
	var body struct {
		RecoveredCents int64 `json:"recoveredCents"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httpErr(w, http.StatusBadRequest, "invalid json")
		return
	}
	c, err := usecase.MarkPaid(r.Context(), h.Pool, id, body.RecoveredCents)
	if err != nil {
		if errors.Is(err, usecase.ErrNotFound) {
			httpErr(w, http.StatusNotFound, "claim not found or wrong state")
			return
		}
		if errors.Is(err, usecase.ErrInvalidInput) {
			httpErr(w, http.StatusBadRequest, err.Error())
			return
		}
		h.Log.Error().Err(err).Str("id", id.String()).Msg("paid claim")
		httpErr(w, http.StatusInternalServerError, "paid failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"claim": claimJSON(*c)})
}

// ── JSON shape ──────────────────────────────────────────────────────

type claimOut struct {
	ID                  string  `json:"id"`
	Ref                 string  `json:"ref"`
	BrokerMC            string  `json:"brokerMc"`
	BrokerName          string  `json:"brokerName"`
	LoadRef             string  `json:"loadRef"`
	DwellHours          float64 `json:"dwellHours"`
	ClaimAmountCents    int64   `json:"claimAmountCents"`
	RecoveredCents      int64   `json:"recoveredCents"`
	Status              string  `json:"status"`
	DraftedSubject      string  `json:"draftedSubject"`
	DraftedBody         string  `json:"draftedBody"`
	AIDrafted           bool    `json:"aiDrafted"`
	SuccessFeeInvoiceID string  `json:"successFeeInvoiceId,omitempty"`
	SuccessFeeURL       string  `json:"successFeeUrl,omitempty"`
	CreatedAt           string  `json:"createdAt"`
	DraftedAt           string  `json:"draftedAt,omitempty"`
	SentAt              string  `json:"sentAt,omitempty"`
	PaidAt              string  `json:"paidAt,omitempty"`
}

func claimJSON(c usecase.Claim) claimOut {
	o := claimOut{
		ID: c.ID.String(), Ref: c.Ref, BrokerMC: c.BrokerMC, BrokerName: c.BrokerName,
		LoadRef: c.LoadRef, DwellHours: c.DwellHours,
		ClaimAmountCents: c.ClaimAmountCents, RecoveredCents: c.RecoveredCents,
		Status: c.Status, DraftedSubject: c.DraftedSubject, DraftedBody: c.DraftedBody,
		AIDrafted:           c.AIDrafted,
		SuccessFeeInvoiceID: c.SuccessFeeInvoiceID,
		SuccessFeeURL:       c.SuccessFeeURL,
		CreatedAt:           c.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
	if c.DraftedAt != nil {
		o.DraftedAt = c.DraftedAt.UTC().Format("2006-01-02T15:04:05Z")
	}
	if c.SentAt != nil {
		o.SentAt = c.SentAt.UTC().Format("2006-01-02T15:04:05Z")
	}
	if c.PaidAt != nil {
		o.PaidAt = c.PaidAt.UTC().Format("2006-01-02T15:04:05Z")
	}
	return o
}

func claimsJSON(cs []usecase.Claim) []claimOut {
	out := make([]claimOut, len(cs))
	for i, c := range cs {
		out[i] = claimJSON(c)
	}
	return out
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func httpErr(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
