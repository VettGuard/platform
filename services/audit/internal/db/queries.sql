-- name: AppendAuditEvent :one
INSERT INTO audit_events (
  tenant_id, actor_id, actor_type, action, target_type, target_id,
  payload, ip, user_agent, request_id, occurred_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, now()))
RETURNING *;

-- name: QueryAuditEvents :many
SELECT *
FROM audit_events
WHERE (sqlc.narg('tenant_id')::uuid IS NULL OR tenant_id = sqlc.narg('tenant_id')::uuid)
  AND (sqlc.narg('actor_id')::uuid  IS NULL OR actor_id  = sqlc.narg('actor_id')::uuid)
  AND (sqlc.narg('action')::text    IS NULL OR action    = sqlc.narg('action')::text)
  AND (sqlc.narg('since')::timestamptz IS NULL OR occurred_at >= sqlc.narg('since')::timestamptz)
  AND (sqlc.narg('until')::timestamptz IS NULL OR occurred_at <  sqlc.narg('until')::timestamptz)
ORDER BY occurred_at DESC
LIMIT $1 OFFSET $2;
