// Package usecase implements the notifier service business logic.
package usecase

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vettguard/vettguard/services/notifier/internal/db"
	"github.com/vettguard/vettguard/services/notifier/internal/postmark"
	"github.com/vettguard/vettguard/services/notifier/internal/templates"
	"github.com/vettguard/vettguard/services/shared/pkg/pgxdb"
)

var (
	ErrMissingIdemKey = errors.New("notifier: idempotency_key required")
	ErrSuppressed     = errors.New("notifier: recipient is suppressed")
)

// SendEmailInput mirrors proto SendEmailRequest semantics.
type SendEmailInput struct {
	TenantID       string // optional; "" → unauth flow (signup verify)
	To             string
	Template       string
	Vars           map[string]string
	IdempotencyKey string
}

// SendEmailOutput returns the Postmark message id and whether the call
// was deduped (caller saw a prior send with the same idempotency_key).
type SendEmailOutput struct {
	MessageID string
	Deduped   bool
}

// SendEmail renders the template, looks up suppressions + idempotency, and
// dispatches via Postmark. Persists a `messages` row in all branches so
// the timeline is auditable.
func SendEmail(
	ctx context.Context,
	pool *pgxpool.Pool,
	pm *postmark.Client,
	in SendEmailInput,
) (SendEmailOutput, error) {
	if in.IdempotencyKey == "" {
		return SendEmailOutput{}, ErrMissingIdemKey
	}

	// Dedup check.
	var existing db.Message
	found := false
	_ = pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		m, err := q.GetMessageByIdempotency(ctx, in.IdempotencyKey)
		if err == nil {
			existing = m
			found = true
		}
		return nil
	})
	if found {
		return SendEmailOutput{
			MessageID: existing.ProviderMsgID.String,
			Deduped:   true,
		}, nil
	}

	// Suppression check.
	suppressed := false
	_ = pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		s, err := q.IsSuppressed(ctx, in.To)
		if err == nil {
			suppressed = s
		}
		return nil
	})
	if suppressed {
		_, _ = insertMessage(ctx, pool, in, "", "dropped", "recipient suppressed")
		return SendEmailOutput{}, ErrSuppressed
	}

	rendered, err := templates.Render(in.Template, in.Vars)
	if err != nil {
		_, _ = insertMessage(ctx, pool, in, "", "failed", err.Error())
		return SendEmailOutput{}, err
	}

	msgID, sendErr := pm.Send(ctx, postmark.Email{
		To:       in.To,
		Subject:  rendered.Subject,
		HTMLBody: rendered.HTMLBody,
		TextBody: rendered.TextBody,
	})
	status := "sent"
	errStr := ""
	if sendErr != nil {
		status = "failed"
		errStr = sendErr.Error()
	}
	if _, err := insertMessage(ctx, pool, in, msgID, status, errStr); err != nil {
		return SendEmailOutput{}, fmt.Errorf("persist message: %w", err)
	}
	if sendErr != nil {
		return SendEmailOutput{}, sendErr
	}
	return SendEmailOutput{MessageID: msgID}, nil
}

func insertMessage(
	ctx context.Context,
	pool *pgxpool.Pool,
	in SendEmailInput,
	providerID, status, errStr string,
) (uuid.UUID, error) {
	var id uuid.UUID
	err := pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		m, err := q.CreateMessage(ctx, db.CreateMessageParams{
			TenantID:       pgxUUID(in.TenantID),
			Channel:        "email",
			Template:       in.Template,
			Recipient:      in.To,
			IdempotencyKey: in.IdempotencyKey,
			ProviderMsgID:  pgxText(providerID),
			Status:         status,
			Error:          pgxText(errStr),
		})
		if err != nil {
			return err
		}
		id = m.ID
		return nil
	})
	return id, err
}

// RecordSuppression upserts a suppression entry — called from the Postmark
// bounce/complaint webhook handler.
func RecordSuppression(ctx context.Context, pool *pgxpool.Pool, recipient, reason, source string) error {
	return pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		return db.New(tx).UpsertSuppression(ctx, db.UpsertSuppressionParams{
			Recipient: recipient,
			Reason:    reason,
			Source:    source,
		})
	})
}

// MarkProviderStatus is called from webhook events with delivery outcomes.
func MarkProviderStatus(ctx context.Context, pool *pgxpool.Pool, providerMsgID, status, errStr string) error {
	return pgxdb.WithBypassTx(ctx, pool, func(tx pgx.Tx) error {
		return db.New(tx).UpdateMessageStatusByProvider(ctx, db.UpdateMessageStatusByProviderParams{
			ProviderMsgID: pgxText(providerMsgID),
			Status:        status,
			Error:         pgxText(errStr),
		})
	})
}

func pgxText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: s, Valid: true}
}

func pgxUUID(s string) pgtype.UUID {
	if s == "" {
		return pgtype.UUID{}
	}
	id, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}
	}
	return pgtype.UUID{Bytes: id, Valid: true}
}
