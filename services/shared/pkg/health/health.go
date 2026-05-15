// Package health provides /healthz and /readyz handlers.
//
// /healthz answers liveness — process is up.
// /readyz answers readiness — process can serve traffic (DB up, deps healthy).
package health

import (
	"encoding/json"
	"net/http"
	"sync/atomic"
)

type Checker struct {
	ready atomic.Bool
	probes []func() error
}

func New() *Checker { return &Checker{} }

// RegisterReadiness adds a probe that must return nil for the service to be ready.
func (c *Checker) RegisterReadiness(probe func() error) {
	c.probes = append(c.probes, probe)
}

// MarkReady flips the readiness gate to true (called after warmup completes).
func (c *Checker) MarkReady() { c.ready.Store(true) }

// HandleLive — liveness probe: always 200 once process is running.
func (c *Checker) HandleLive(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "alive"})
}

// HandleReady — readiness probe: 200 only when all probes pass and MarkReady has fired.
func (c *Checker) HandleReady(w http.ResponseWriter, _ *http.Request) {
	if !c.ready.Load() {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"status": "warming"})
		return
	}
	for _, probe := range c.probes {
		if err := probe(); err != nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{
				"status": "not_ready",
				"error":  err.Error(),
			})
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
}

func writeJSON(w http.ResponseWriter, code int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(body)
}
