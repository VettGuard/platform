-- name: GetMessageByIdempotency :one
SELECT * FROM messages WHERE idempotency_key = $1;

-- name: CreateMessage :one
INSERT INTO messages (
  tenant_id, channel, template, recipient, idempotency_key, provider_msg_id, status, error
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: UpdateMessageStatus :exec
UPDATE messages SET status = $2, error = $3, updated_at = now() WHERE id = $1;

-- name: UpdateMessageStatusByProvider :exec
UPDATE messages SET status = $2, error = $3, updated_at = now() WHERE provider_msg_id = $1;

-- name: IsSuppressed :one
SELECT EXISTS(SELECT 1 FROM suppressions WHERE recipient = $1) AS suppressed;

-- name: UpsertSuppression :exec
INSERT INTO suppressions (recipient, reason, source) VALUES ($1, $2, $3)
ON CONFLICT (recipient) DO UPDATE
  SET reason = EXCLUDED.reason,
      source = EXCLUDED.source;
