package auth

import "testing"

func TestPasswordRoundTrip(t *testing.T) {
	t.Parallel()
	hashed, err := HashPassword("correct-horse-battery-staple")
	if err != nil {
		t.Fatalf("hash: %v", err)
	}
	if err := VerifyPassword(hashed, "correct-horse-battery-staple"); err != nil {
		t.Fatalf("verify correct: %v", err)
	}
	if err := VerifyPassword(hashed, "wrong-password"); err == nil {
		t.Fatal("expected mismatch for wrong password")
	}
}

func TestVerifyMalformed(t *testing.T) {
	t.Parallel()
	for _, bad := range []string{
		"",
		"plaintext",
		"$argon2id$v=19$m=64,t=3,p=1$tooshort",
		"$bcrypt$something",
	} {
		if err := VerifyPassword(bad, "x"); err == nil {
			t.Errorf("expected error for %q", bad)
		}
	}
}

func TestTokenIsHashable(t *testing.T) {
	t.Parallel()
	raw, hash, err := NewToken()
	if err != nil {
		t.Fatalf("token: %v", err)
	}
	if HashToken(raw) != hash {
		t.Fatal("HashToken(raw) != hash from NewToken")
	}
	raw2, _, _ := NewToken()
	if raw == raw2 {
		t.Fatal("tokens collided — entropy broken")
	}
}
