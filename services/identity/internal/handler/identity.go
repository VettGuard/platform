// Package handler exposes the identity service over Connect-RPC. Each method
// is a thin adapter: validate input, call the usecase, map domain errors to
// connect codes. Business logic stays in internal/usecase.
package handler

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"connectrpc.com/connect"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	pb "github.com/vettguard/vettguard/packages/proto/gen/go"
	"github.com/vettguard/vettguard/packages/proto/gen/go/protov1connect"
	"github.com/vettguard/vettguard/services/identity/internal/auth"
	"github.com/vettguard/vettguard/services/identity/internal/db"
	"github.com/vettguard/vettguard/services/identity/internal/oauth"
	"github.com/vettguard/vettguard/services/identity/internal/usecase"
	"github.com/vettguard/vettguard/services/shared/pkg/pgxdb"
)

// Compile-time assertion the handler satisfies the generated interface.
var _ protov1connect.IdentityHandler = (*Identity)(nil)

type Identity struct {
	Pool       *pgxpool.Pool
	Signer     *auth.JWTSigner
	AEAD       *auth.AEAD
	URLs       usecase.URLBuilder
	Notifier   usecase.Notifier
	LoginRate  *auth.IPRateLimiter // optional; nil disables limiting
	OAuth      *oauth.Config
	OAuthState *oauth.StateStore
}

// slugRe slugifies a tenant name: lowercase ASCII letters/digits/dashes.
var slugRe = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(name string) string {
	s := slugRe.ReplaceAllString(strings.ToLower(name), "-")
	return strings.Trim(s, "-")
}

func (h *Identity) SignUpWithEmail(
	ctx context.Context,
	req *connect.Request[pb.SignUpRequest],
) (*connect.Response[pb.SignUpResponse], error) {
	in := req.Msg
	if in.GetEmail() == "" || in.GetPassword() == "" || in.GetTenantName() == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("email, password, tenant_name required"))
	}
	out, err := usecase.SignUp(ctx, h.Pool, h.URLs, h.Notifier, usecase.SignUpInput{
		TenantName: in.GetTenantName(),
		TenantSlug: slugify(in.GetTenantName()),
		Email:      strings.ToLower(strings.TrimSpace(in.GetEmail())),
		Password:   in.GetPassword(),
		FullName:   in.GetFullName(),
	})
	if err != nil {
		return nil, mapErr(err)
	}
	return connect.NewResponse(&pb.SignUpResponse{
		Tenant: &pb.Tenant{Id: out.TenantID.String(), Name: in.GetTenantName(), Slug: slugify(in.GetTenantName())},
		User:   &pb.User{Id: out.UserID.String(), Email: in.GetEmail(), FullName: in.GetFullName()},
	}), nil
}

func (h *Identity) LoginWithEmail(
	ctx context.Context,
	req *connect.Request[pb.LoginRequest],
) (*connect.Response[pb.LoginResponse], error) {
	in := req.Msg
	if h.LoginRate != nil && !h.LoginRate.Allow(req.Peer().Addr) {
		return nil, connect.NewError(connect.CodeResourceExhausted, errors.New("login: rate limit exceeded"))
	}
	out, err := usecase.Login(ctx, h.Pool, usecase.LoginInput{
		Email:    strings.ToLower(strings.TrimSpace(in.GetEmail())),
		Password: in.GetPassword(),
	})
	if err != nil {
		return nil, mapErr(err)
	}
	if !out.EmailVerified {
		return nil, connect.NewError(connect.CodeFailedPrecondition, usecase.ErrEmailNotVerified)
	}
	if len(out.Memberships) == 0 {
		return nil, connect.NewError(connect.CodePermissionDenied, errors.New("no tenant memberships"))
	}

	// TOTP gate: if user has a verified factor, require a valid code.
	hasTOTP, err := usecase.HasVerifiedTOTP(ctx, h.Pool, out.UserID)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	if hasTOTP {
		if in.GetTotpCode() == "" {
			return nil, connect.NewError(connect.CodeUnauthenticated, errors.New("totp code required"))
		}
		if err := usecase.CheckTOTPCode(ctx, h.Pool, h.AEAD, out.UserID, in.GetTotpCode()); err != nil {
			return nil, mapErr(err)
		}
	}
	// MVP: default to first membership. Multi-tenant UI will let user pick.
	m := out.Memberships[0]

	tokens, err := usecase.IssueSession(ctx, h.Pool, h.Signer, usecase.IssueSessionInput{
		UserID:    out.UserID,
		TenantID:  m.TenantID,
		UserAgent: req.Header().Get("User-Agent"),
		IP:        req.Peer().Addr,
	})
	if err != nil {
		return nil, mapErr(err)
	}
	return connect.NewResponse(&pb.LoginResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		User: &pb.User{
			Id:       out.UserID.String(),
			Email:    in.GetEmail(),
			FullName: out.FullName,
			Verified: out.EmailVerified,
		},
	}), nil
}

func (h *Identity) VerifySession(
	ctx context.Context,
	req *connect.Request[pb.VerifySessionRequest],
) (*connect.Response[pb.VerifySessionResponse], error) {
	claims, err := h.Signer.Verify(req.Msg.GetAccessToken())
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, err)
	}
	return connect.NewResponse(&pb.VerifySessionResponse{
		Context: &pb.TenantContext{
			TenantId: claims.Tid.String(),
			UserId:   claims.Sub.String(),
		},
		Role: roleFromString(claims.Role),
	}), nil
}

func (h *Identity) RefreshSession(
	ctx context.Context,
	req *connect.Request[pb.RefreshSessionRequest],
) (*connect.Response[pb.RefreshSessionResponse], error) {
	tokens, err := usecase.RefreshSession(ctx, h.Pool, h.Signer, req.Msg.GetRefreshToken())
	if err != nil {
		return nil, mapErr(err)
	}
	return connect.NewResponse(&pb.RefreshSessionResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
	}), nil
}

func (h *Identity) RevokeSession(
	ctx context.Context,
	req *connect.Request[pb.RevokeSessionRequest],
) (*connect.Response[pb.RevokeSessionResponse], error) {
	id, err := uuid.Parse(req.Msg.GetSessionId())
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("session_id must be uuid"))
	}
	err = pgxdb.WithBypassTx(ctx, h.Pool, func(tx pgx.Tx) error {
		q := db.New(tx)
		return q.RevokeSession(ctx, db.RevokeSessionParams{
			ID:            id,
			RevokedReason: pgtype.Text{String: "user_logout", Valid: true},
		})
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&pb.RevokeSessionResponse{Ok: true}), nil
}

// ─── unimplemented stubs (Sprint 2 backlog) ─────────────────────────────────

func (h *Identity) CreateTenant(context.Context, *connect.Request[pb.CreateTenantRequest]) (*connect.Response[pb.CreateTenantResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("CreateTenant: use SignUpWithEmail"))
}
func (h *Identity) GetTenant(context.Context, *connect.Request[pb.GetTenantRequest]) (*connect.Response[pb.GetTenantResponse], error) {
	return nil, connect.NewError(connect.CodeUnimplemented, nil)
}
func (h *Identity) StartOAuth(
	ctx context.Context,
	req *connect.Request[pb.StartOAuthRequest],
) (*connect.Response[pb.StartOAuthResponse], error) {
	if h.OAuth == nil || h.OAuthState == nil {
		return nil, connect.NewError(connect.CodeUnimplemented, errors.New("oauth not configured"))
	}
	provider := req.Msg.GetProvider()
	state := uuid.NewString()
	url, err := h.OAuth.AuthorizeURL(provider, state)
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	h.OAuthState.Save(state, provider)
	return connect.NewResponse(&pb.StartOAuthResponse{AuthorizeUrl: url, State: state}), nil
}

func (h *Identity) CompleteOAuth(
	ctx context.Context,
	req *connect.Request[pb.CompleteOAuthRequest],
) (*connect.Response[pb.CompleteOAuthResponse], error) {
	if h.OAuth == nil || h.OAuthState == nil {
		return nil, connect.NewError(connect.CodeUnimplemented, errors.New("oauth not configured"))
	}
	provider, err := h.OAuthState.Consume(req.Msg.GetState())
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	if provider != req.Msg.GetProvider() {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("oauth: provider/state mismatch"))
	}

	info, err := h.OAuth.Exchange(ctx, provider, req.Msg.GetCode())
	if err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, err)
	}

	resolved, err := usecase.LinkOrCreateOAuthUser(ctx, h.Pool, provider, info.ExternalID, info.Email, info.FullName)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	resp := &pb.CompleteOAuthResponse{
		Created: resolved.Created,
		User: &pb.User{
			Id:       resolved.UserID.String(),
			Email:    info.Email,
			FullName: resolved.FullName,
			Verified: true,
		},
	}
	// If the OAuth user has at least one tenant membership, issue a session.
	// Brand-new users get no tokens — dashboard will route them through tenant onboarding.
	if len(resolved.Memberships) > 0 {
		m := resolved.Memberships[0]
		tokens, err := usecase.IssueSession(ctx, h.Pool, h.Signer, usecase.IssueSessionInput{
			UserID:    resolved.UserID,
			TenantID:  m.TenantID,
			UserAgent: req.Header().Get("User-Agent"),
			IP:        req.Peer().Addr,
		})
		if err != nil {
			return nil, connect.NewError(connect.CodeInternal, err)
		}
		resp.AccessToken = tokens.AccessToken
		resp.RefreshToken = tokens.RefreshToken
	}
	return connect.NewResponse(resp), nil
}
func (h *Identity) EnableTOTP(
	ctx context.Context,
	req *connect.Request[pb.EnableTOTPRequest],
) (*connect.Response[pb.EnableTOTPResponse], error) {
	userID, err := uuid.Parse(req.Msg.GetUserId())
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("user_id must be uuid"))
	}
	out, err := usecase.EnableTOTP(ctx, h.Pool, h.AEAD, userID, userID.String())
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&pb.EnableTOTPResponse{
		Secret:        out.Secret,
		QrUri:         out.OtpAuthURL,
		RecoveryCodes: out.RecoveryCodes,
	}), nil
}

func (h *Identity) VerifyTOTP(
	ctx context.Context,
	req *connect.Request[pb.VerifyTOTPRequest],
) (*connect.Response[pb.VerifyTOTPResponse], error) {
	userID, err := uuid.Parse(req.Msg.GetUserId())
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, errors.New("user_id must be uuid"))
	}
	if err := usecase.VerifyTOTP(ctx, h.Pool, h.AEAD, userID, req.Msg.GetCode()); err != nil {
		return nil, mapErr(err)
	}
	return connect.NewResponse(&pb.VerifyTOTPResponse{Ok: true}), nil
}

func roleFromString(s string) pb.Role {
	switch s {
	case "owner":
		return pb.Role_ROLE_OWNER
	case "admin":
		return pb.Role_ROLE_ADMIN
	case "dispatcher":
		return pb.Role_ROLE_DISPATCHER
	case "viewer":
		return pb.Role_ROLE_VIEWER
	default:
		return pb.Role_ROLE_UNSPECIFIED
	}
}

func mapErr(err error) error {
	switch {
	case errors.Is(err, usecase.ErrEmailTaken):
		return connect.NewError(connect.CodeAlreadyExists, err)
	case errors.Is(err, usecase.ErrBadCredentials):
		return connect.NewError(connect.CodeUnauthenticated, err)
	case errors.Is(err, usecase.ErrAccountLocked):
		return connect.NewError(connect.CodeResourceExhausted, err)
	case errors.Is(err, usecase.ErrTokenInvalid):
		return connect.NewError(connect.CodeUnauthenticated, err)
	case errors.Is(err, usecase.ErrEmailNotVerified):
		return connect.NewError(connect.CodeFailedPrecondition, err)
	default:
		return connect.NewError(connect.CodeInternal, err)
	}
}
