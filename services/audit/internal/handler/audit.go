// Package handler exposes the audit service over Connect-RPC.
package handler

import (
	"context"
	"errors"
	"net/netip"
	"time"

	"connectrpc.com/connect"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/protobuf/types/known/timestamppb"

	pb "github.com/vettguard/vettguard/packages/proto/gen/go"
	"github.com/vettguard/vettguard/packages/proto/gen/go/protov1connect"
	"github.com/vettguard/vettguard/services/audit/internal/db"
	"github.com/vettguard/vettguard/services/shared/pkg/pgxdb"
)

var _ protov1connect.AuditHandler = (*Audit)(nil)

const defaultPageSize = 50
const maxPageSize = 200

type Audit struct {
	Pool *pgxpool.Pool
}

func (h *Audit) Append(
	ctx context.Context,
	req *connect.Request[pb.AppendEventRequest],
) (*connect.Response[pb.AppendEventResponse], error) {
	in := req.Msg.GetEvent()
	if in == nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("event required"))
	}
	if in.GetAction() == "" || in.GetActorType() == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("action + actor_type required"))
	}

	var occurredAt any
	if t := in.GetOccurredAt(); t != nil {
		occurredAt = t.AsTime()
	}

	var saved db.AuditEvent
	err := pgxdb.WithBypassTx(ctx, h.Pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		e, err := q.AppendAuditEvent(ctx, db.AppendAuditEventParams{
			TenantID:   pgxUUID(in.GetTenantId()),
			ActorID:    pgxUUID(in.GetActorId()),
			ActorType:  in.GetActorType(),
			Action:     in.GetAction(),
			TargetType: pgxText(in.GetTargetType()),
			TargetID:   pgxText(in.GetTargetId()),
			Payload:    in.GetPayload(),
			Ip:         pgxInet(in.GetIp()),
			UserAgent:  pgxText(in.GetUserAgent()),
			RequestID:  pgxText(in.GetRequestId()),
			Column11:   occurredAt,
		})
		if err != nil {
			return err
		}
		saved = e
		return nil
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&pb.AppendEventResponse{EventId: saved.ID.String()}), nil
}

func (h *Audit) Query(
	ctx context.Context,
	req *connect.Request[pb.QueryEventsRequest],
) (*connect.Response[pb.QueryEventsResponse], error) {
	page := req.Msg.GetPage()
	limit := defaultPageSize
	if page != nil && page.GetPageSize() > 0 {
		limit = min(int(page.GetPageSize()), maxPageSize)
	}
	offset := decodeCursor(page.GetCursor())

	var events []db.AuditEvent
	err := pgxdb.WithBypassTx(ctx, h.Pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		var err error
		events, err = q.QueryAuditEvents(ctx, db.QueryAuditEventsParams{
			Limit:    int32(limit),
			Offset:   int32(offset),
			TenantID: pgxUUID(req.Msg.GetTenantId()),
			ActorID:  pgxUUID(req.Msg.GetActorId()),
			Action:   pgxText(req.Msg.GetAction()),
			Since:    pgxTime(req.Msg.GetSince()),
			Until:    pgxTime(req.Msg.GetUntil()),
		})
		return err
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	out := &pb.QueryEventsResponse{
		Events: make([]*pb.AuditEvent, len(events)),
		Page: &pb.PageResponse{
			Total: -1, // cursor pagination; exact count too expensive on a partitioned table
		},
	}
	for i, e := range events {
		out.Events[i] = toProto(e)
	}
	if len(events) == limit {
		out.Page.NextCursor = encodeCursor(offset + limit)
	}
	return connect.NewResponse(out), nil
}

func toProto(e db.AuditEvent) *pb.AuditEvent {
	pe := &pb.AuditEvent{
		Id:         e.ID.String(),
		ActorType:  e.ActorType,
		Action:     e.Action,
		Payload:    e.Payload,
		OccurredAt: timestamppb.New(e.OccurredAt.Time),
	}
	if e.TenantID.Valid {
		pe.TenantId = uuid.UUID(e.TenantID.Bytes).String()
	}
	if e.ActorID.Valid {
		pe.ActorId = uuid.UUID(e.ActorID.Bytes).String()
	}
	pe.TargetType = e.TargetType.String
	pe.TargetId = e.TargetID.String
	pe.UserAgent = e.UserAgent.String
	pe.RequestId = e.RequestID.String
	if e.Ip != nil {
		pe.Ip = e.Ip.String()
	}
	return pe
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

func pgxText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: s, Valid: true}
}

func pgxTime(t *timestamppb.Timestamp) pgtype.Timestamptz {
	if t == nil {
		return pgtype.Timestamptz{}
	}
	return pgtype.Timestamptz{Time: t.AsTime(), Valid: true}
}

func pgxInet(s string) *netip.Addr {
	if s == "" {
		return nil
	}
	a, err := netip.ParseAddr(s)
	if err != nil {
		return nil
	}
	return &a
}

// encodeCursor / decodeCursor implement offset-based cursoring. We swap to
// keyset (occurred_at < cursor_ts) when the audit table grows past ~10M rows
// — for sprint 2, offset is fine and dead-simple.
func encodeCursor(offset int) string {
	return time.Now().UTC().Format("2006-01-02T15:04:05") + "@" + itoa(offset)
}

func decodeCursor(c string) int {
	if c == "" {
		return 0
	}
	for i := len(c) - 1; i >= 0; i-- {
		if c[i] == '@' {
			return atoi(c[i+1:])
		}
	}
	return 0
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var b [20]byte
	i := len(b)
	neg := n < 0
	if neg {
		n = -n
	}
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		b[i] = '-'
	}
	return string(b[i:])
}

func atoi(s string) int {
	n := 0
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c < '0' || c > '9' {
			return 0
		}
		n = n*10 + int(c-'0')
	}
	return n
}
