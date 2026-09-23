package usecase

import (
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// pgxNullable wraps a possibly-empty string as a pgtype.Text. Empty → SQL NULL.
func pgxNullable(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: s, Valid: true}
}

// pgxTime wraps a time.Time as a pgtype.Timestamptz.
func pgxTime(t time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: t, Valid: true}
}
