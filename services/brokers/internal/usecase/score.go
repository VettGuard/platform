package usecase

// Broker scoring — prefers the AI gateway when `AI_GATEWAY_URL` is set,
// falls back to a deterministic FNV-1a hash when AI is unreachable or
// the env var is empty. The hash matches
// apps/extension/src/content/mock-score.ts so the extension chip and a
// fresh server-side score agree when AI is offline.
//
// We never block a Vet on AI failure — the dashboard would otherwise
// surface a 5xx instead of a chip, which is strictly worse than a
// neutral mock score with a "scoring degraded" log line.

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

type Snapshot struct {
	Value   int
	PayDays int
	Status  string // 'preferred' | 'active' | 'watch' | 'blocked'
}

// ScoreFor is the synchronous wrapper kept for back-compat; calls
// ScoreForCtx with a 5-second timeout.
func ScoreFor(mc string) Snapshot {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return ScoreForCtx(ctx, mc, "", "")
}

// ScoreForCtx queries the AI gateway when configured, otherwise mock.
// tenantID is forwarded to the AI gateway for budget enforcement.
func ScoreForCtx(ctx context.Context, mc, name, city string) Snapshot {
	aiURL := strings.TrimRight(os.Getenv("AI_GATEWAY_URL"), "/")
	if aiURL != "" {
		if snap, ok := scoreViaAI(ctx, aiURL, mc, name, city); ok {
			return snap
		}
	}
	return mockScore(mc)
}

func scoreViaAI(ctx context.Context, base, mc, name, city string) (Snapshot, bool) {
	body, err := json.Marshal(map[string]any{
		"mc":     mc,
		"name":   name,
		"city":   city,
		"signals": "",
		"model":  "claude-haiku-4-5",
		"ctx": map[string]any{
			// Tenant id is required by the AI gateway's budget gate. We
			// pull it from the request context tenantctx earlier in the
			// call chain; ScoreForCtx receives a context already scoped
			// to the active tenant.
			"tenant_id": tenantIDFromCtx(ctx),
		},
	})
	if err != nil {
		return Snapshot{}, false
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, base+"/v1/ai/score-broker", strings.NewReader(string(body)))
	if err != nil {
		return Snapshot{}, false
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 8 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Fprintf(os.Stderr, "brokers: AI gateway unreachable: %v\n", err)
		return Snapshot{}, false
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode >= 400 {
		fmt.Fprintf(os.Stderr, "brokers: AI gateway returned %d for %s\n", resp.StatusCode, mc)
		return Snapshot{}, false
	}

	var out struct {
		Score   int    `json:"score"`
		Status  string `json:"status"`
		PayDays int    `json:"pay_days"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return Snapshot{}, false
	}
	if out.Status == "" {
		out.Status = statusForScore(out.Score)
	}
	return Snapshot{Value: out.Score, PayDays: out.PayDays, Status: out.Status}, true
}

// tenantIDFromCtx returns the active tenant uuid string when set by the
// handler middleware, or an empty string. AI gateway treats empty as
// "system" for budget purposes (will be rejected unless config allows).
func tenantIDFromCtx(ctx context.Context) string {
	tid, err := tenantID(ctx)
	if err != nil {
		return ""
	}
	return tid.String()
}

// mockScore reproduces the extension's FNV-1a fallback so the two
// surfaces agree when the AI gateway is unavailable.
func mockScore(mc string) Snapshot {
	h := fnv1a(strings.ToUpper(mc))
	value := 25 + int(h%74) // 25..98
	payDays := 15 + int((h>>7)%50) // 15..64
	return Snapshot{Value: value, PayDays: payDays, Status: statusForScore(value)}
}

func statusForScore(value int) string {
	switch {
	case value >= 85:
		return "preferred"
	case value >= 70:
		return "active"
	case value >= 50:
		return "watch"
	default:
		return "blocked"
	}
}

// 32-bit FNV-1a. Identical to the JS port in the extension.
func fnv1a(s string) uint32 {
	const offset, prime uint32 = 0x811c9dc5, 0x01000193
	h := offset
	for _, c := range []byte(s) {
		h ^= uint32(c)
		h *= prime
	}
	return h
}
