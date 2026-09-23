package auth

import (
	"crypto/rand"
	"encoding/base64"
	"time"
)

func timeNowForTest() time.Time { return time.Now() }

func GenerateAEADKeyForTest() (string, error) {
	k := make([]byte, 32)
	if _, err := rand.Read(k); err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(k), nil
}
