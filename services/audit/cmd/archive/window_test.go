package main

import (
	"testing"
	"time"
)

func TestResolveWindow(t *testing.T) {
	now := time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC)

	start, end, key, err := resolveWindow("", now)
	if err != nil {
		t.Fatal(err)
	}
	wantStart := time.Date(2026, 4, 1, 0, 0, 0, 0, time.UTC)
	wantEnd := time.Date(2026, 5, 1, 0, 0, 0, 0, time.UTC)
	if !start.Equal(wantStart) || !end.Equal(wantEnd) {
		t.Fatalf("empty arg: got [%s, %s); want [%s, %s)", start, end, wantStart, wantEnd)
	}
	if key != "audit/2026/04.jsonl.gz" {
		t.Fatalf("key: got %q", key)
	}
}

func TestResolveWindowExplicit(t *testing.T) {
	now := time.Now()
	start, end, key, err := resolveWindow("2026-01", now)
	if err != nil {
		t.Fatal(err)
	}
	if !start.Equal(time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)) {
		t.Fatalf("start: %s", start)
	}
	if !end.Equal(time.Date(2026, 2, 1, 0, 0, 0, 0, time.UTC)) {
		t.Fatalf("end: %s", end)
	}
	if key != "audit/2026/01.jsonl.gz" {
		t.Fatalf("key: %q", key)
	}
}

func TestResolveWindowBadFormat(t *testing.T) {
	if _, _, _, err := resolveWindow("bad", time.Now()); err == nil {
		t.Fatal("expected error")
	}
}

func TestResolveWindowYearRollover(t *testing.T) {
	now := time.Date(2026, 1, 5, 0, 0, 0, 0, time.UTC)
	start, _, key, err := resolveWindow("", now)
	if err != nil {
		t.Fatal(err)
	}
	if !start.Equal(time.Date(2025, 12, 1, 0, 0, 0, 0, time.UTC)) {
		t.Fatalf("start: %s", start)
	}
	if key != "audit/2025/12.jsonl.gz" {
		t.Fatalf("key: %q", key)
	}
}
