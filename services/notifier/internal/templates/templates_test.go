package templates

import (
	"errors"
	"strings"
	"testing"
)

func TestRenderAuthVerify(t *testing.T) {
	r, err := Render(AuthVerify, map[string]string{
		"full_name":  "Alex",
		"verify_url": "https://app.vettguard.com/verify-email?token=xyz",
	})
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(r.TextBody, "Alex") || !strings.Contains(r.TextBody, "token=xyz") {
		t.Fatalf("text body missing vars: %q", r.TextBody)
	}
	if !strings.Contains(r.HTMLBody, "<a href") {
		t.Fatalf("html body missing link: %q", r.HTMLBody)
	}
	if r.Subject == "" {
		t.Fatal("empty subject")
	}
}

func TestRenderMissingVar(t *testing.T) {
	_, err := Render(AuthReset, map[string]string{"full_name": "Alex"})
	if !errors.Is(err, ErrMissingVar) {
		t.Fatalf("expected ErrMissingVar, got %v", err)
	}
}

func TestRenderUnknown(t *testing.T) {
	_, err := Render("nope", nil)
	if !errors.Is(err, ErrUnknown) {
		t.Fatalf("expected ErrUnknown, got %v", err)
	}
}

func TestRenderBillingInvoiceSubjectInterp(t *testing.T) {
	r, err := Render(BillingInvoice, map[string]string{
		"invoice_number": "INV-001",
		"amount":         "$199.00",
		"hosted_url":     "https://invoice.stripe.com/x",
	})
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(r.Subject, "INV-001") {
		t.Fatalf("subject not interpolated: %q", r.Subject)
	}
}
