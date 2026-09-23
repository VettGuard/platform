package auth

import (
	"strings"
	"testing"

	"github.com/pquerna/otp/totp"
)

func TestTOTPGenerateAndValidate(t *testing.T) {
	setup, err := GenerateTOTP("test@vettguard.com")
	if err != nil {
		t.Fatal(err)
	}
	if setup.Secret == "" || !strings.HasPrefix(setup.OtpAuthURL, "otpauth://totp/") {
		t.Fatalf("bad setup: %+v", setup)
	}
	if len(setup.RecoveryCodes) != 10 {
		t.Fatalf("want 10 recovery codes, got %d", len(setup.RecoveryCodes))
	}
	code, err := totp.GenerateCode(setup.Secret, timeNowForTest())
	if err != nil {
		t.Fatal(err)
	}
	if !ValidateTOTP(setup.Secret, code) {
		t.Fatal("expected fresh code to validate")
	}
	if ValidateTOTP(setup.Secret, "000000") {
		t.Fatal("000000 should not validate by accident")
	}
}

func TestAEADRoundTrip(t *testing.T) {
	key, _ := GenerateAEADKeyForTest()
	a, err := NewAEAD(key)
	if err != nil {
		t.Fatal(err)
	}
	want := []byte("super secret totp seed")
	blob, err := a.Seal(want)
	if err != nil {
		t.Fatal(err)
	}
	got, err := a.Open(blob)
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != string(want) {
		t.Fatalf("roundtrip: want %q got %q", want, got)
	}
}
