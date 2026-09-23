// Package handler exposes the brokers usecases over plain HTTP/JSON.
//
// We intentionally skip Connect-RPC for this service — broker data is
// straightforward CRUD and the dashboard already speaks JSON. Picking
// Connect would buy us streaming + typed clients we don't need yet.
// When the AI gateway's score-broker endpoint lands we can swap the
// usecase.ScoreFor stub for an HTTP call without touching handler shape.
package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"

	"github.com/vettguard/vettguard/services/brokers/internal/usecase"
)

type Brokers struct {
	Pool *pgxpool.Pool
	Log  zerolog.Logger
}

// Mount registers the brokers routes on r. The caller is responsible for
// wrapping with the auth + tenantctx middleware (gateway does both).
func (b *Brokers) Mount(r chi.Router) {
	r.Get("/v1/brokers", b.list)
	r.Post("/v1/brokers/vet", b.vet)
	r.Get("/v1/brokers/{mc}", b.get)
}

// list — GET /v1/brokers
func (b *Brokers) list(w http.ResponseWriter, r *http.Request) {
	out, err := usecase.List(r.Context(), b.Pool)
	if err != nil {
		b.Log.Error().Err(err).Msg("list brokers")
		httpErr(w, http.StatusInternalServerError, "list failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"brokers": brokersJSON(out)})
}

// vet — POST /v1/brokers/vet  { mc, name?, city? }
func (b *Brokers) vet(w http.ResponseWriter, r *http.Request) {
	var body struct {
		MC   string `json:"mc"`
		Name string `json:"name"`
		City string `json:"city"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httpErr(w, http.StatusBadRequest, "invalid json")
		return
	}
	br, err := usecase.Vet(r.Context(), b.Pool, usecase.VetInput{
		MC: body.MC, Name: body.Name, City: body.City,
	})
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidMC) {
			httpErr(w, http.StatusBadRequest, "invalid MC number")
			return
		}
		b.Log.Error().Err(err).Msg("vet broker")
		httpErr(w, http.StatusInternalServerError, "vet failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"broker": brokerJSON(*br)})
}

// get — GET /v1/brokers/{mc}
func (b *Brokers) get(w http.ResponseWriter, r *http.Request) {
	mc := chi.URLParam(r, "mc")
	br, err := usecase.Get(r.Context(), b.Pool, mc)
	if err != nil {
		if errors.Is(err, usecase.ErrNotFound) {
			httpErr(w, http.StatusNotFound, "broker not found")
			return
		}
		if errors.Is(err, usecase.ErrInvalidMC) {
			httpErr(w, http.StatusBadRequest, "invalid MC number")
			return
		}
		b.Log.Error().Err(err).Msg("get broker")
		httpErr(w, http.StatusInternalServerError, "get failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"broker": brokerJSON(*br)})
}

// ── JSON shapes ─────────────────────────────────────────────────────
// Custom marshalling so the dashboard doesn't need to know about Go
// time.Time vs JS Date subtleties; everything goes out as ISO strings.

type brokerOut struct {
	ID             string `json:"id"`
	MC             string `json:"mc"`
	Name           string `json:"name"`
	City           string `json:"city"`
	Score          int    `json:"score"`
	PayDays        int    `json:"payDays"`
	Loads          int    `json:"loads"`
	RecoveredCents int64  `json:"recoveredCents"`
	Status         string `json:"status"`
	LastScoredAt   string `json:"lastScoredAt"`
}

func brokerJSON(b usecase.Broker) brokerOut {
	return brokerOut{
		ID: b.ID.String(), MC: b.MC, Name: b.Name, City: b.City,
		Score: b.Score, PayDays: b.PayDays, Loads: b.Loads,
		RecoveredCents: b.RecoveredCents, Status: b.Status,
		LastScoredAt: b.LastScoredAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
}

func brokersJSON(bs []usecase.Broker) []brokerOut {
	out := make([]brokerOut, len(bs))
	for i, b := range bs {
		out[i] = brokerJSON(b)
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
