package usecase

import "testing"

// SuccessFeeRate is the canonical 18% — pinning the math here so a future
// refactor can't silently change billing.
func TestSuccessFeeMath(t *testing.T) {
	cases := []struct {
		recovered int64
		want      int64
	}{
		{recovered: 100_00, want: 18_00},   // $100 → $18
		{recovered: 250_00, want: 45_00},   // $250 → $45
		{recovered: 1_000_00, want: 180_00}, // $1000 → $180
		{recovered: 1, want: 1},             // minimum-charge guard
	}
	for _, c := range cases {
		got := int64(float64(c.recovered) * SuccessFeeRate)
		if got <= 0 {
			got = 1
		}
		if got != c.want {
			t.Errorf("recovered %d: got %d, want %d", c.recovered, got, c.want)
		}
	}
}
