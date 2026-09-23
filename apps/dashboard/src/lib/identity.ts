// Typed fetch wrappers around the identity service's Connect-RPC handlers.
// Connect supports JSON over HTTP at `/<package>.<Service>/<Method>` so we
// don't need a generated client to talk to it. The gateway terminates auth
// + rate limit + CORS in front; we POST through it.
//
// Phase 4 swap: switch to the buf-generated TS client when we want streaming
// or richer error shapes. The shape of these helpers stays the same.

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080"

const SERVICE = "vettguard.v1.Identity"

export type LoginInput = {
  email: string
  password: string
  totpCode?: string
}

export type AuthedSessionResponse = {
  accessToken: string
  refreshToken: string
  user?: {
    id: string
    email: string
    fullName: string
    verified: boolean
    mfaOn: boolean
  }
}

export type RefreshResponse = {
  accessToken: string
  refreshToken: string
}

export type IdentityErrorBody = {
  code?: string
  message?: string
}

export class IdentityError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function call<T>(
  method: string,
  body: unknown,
  init: { headers?: Record<string, string> } = {},
): Promise<T> {
  const res = await fetch(`${GATEWAY_URL}/${SERVICE}/${method}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      ...(init.headers ?? {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const text = await res.text()
  // Connect uses 2xx for success and embeds error codes in the body for
  // failures. We treat 4xx/5xx as errors regardless and parse the body.
  let parsed: unknown
  try {
    parsed = text ? (JSON.parse(text) as unknown) : {}
  } catch {
    parsed = { message: text }
  }
  if (!res.ok) {
    const e = parsed as IdentityErrorBody
    throw new IdentityError(
      res.status,
      e.code ?? "unknown",
      e.message ?? res.statusText,
    )
  }
  return parsed as T
}

export function loginWithEmail(input: LoginInput): Promise<AuthedSessionResponse> {
  return call<AuthedSessionResponse>("LoginWithEmail", {
    email: input.email,
    password: input.password,
    totpCode: input.totpCode ?? "",
  })
}

export function refreshSession(refreshToken: string): Promise<RefreshResponse> {
  return call<RefreshResponse>("RefreshSession", { refreshToken })
}

export function revokeSession(sessionId: string): Promise<{ ok: boolean }> {
  return call<{ ok: boolean }>("RevokeSession", { sessionId })
}

export type SignUpInput = {
  tenantName: string
  email: string
  password: string
  fullName: string
}

export type SignUpResponse = {
  tenant?: { id: string; name: string; slug: string }
  user?: { id: string; email: string; fullName: string }
}

export function signUpWithEmail(input: SignUpInput): Promise<SignUpResponse> {
  return call<SignUpResponse>("SignUpWithEmail", input)
}

// ── OAuth ────────────────────────────────────────────────────────────
export type OAuthProvider = "google" | "microsoft"

export type StartOAuthResponse = {
  authorizeUrl: string
  state: string
}

export type CompleteOAuthResponse = {
  accessToken: string
  refreshToken: string
  user?: {
    id: string
    email: string
    fullName: string
    verified: boolean
  }
  created: boolean
}

export function startOAuth(
  provider: OAuthProvider,
  redirectUri: string,
): Promise<StartOAuthResponse> {
  return call<StartOAuthResponse>("StartOAuth", { provider, redirectUri })
}

export function completeOAuth(
  provider: OAuthProvider,
  code: string,
  state: string,
): Promise<CompleteOAuthResponse> {
  return call<CompleteOAuthResponse>("CompleteOAuth", {
    provider,
    code,
    state,
  })
}

// ── TOTP 2FA ─────────────────────────────────────────────────────────
export type EnableTOTPResponse = {
  secret: string
  qrUri: string // otpauth://totp/Issuer:user?secret=...&issuer=...
  recoveryCodes: string[]
}

export function enableTOTP(userId: string): Promise<EnableTOTPResponse> {
  return call<EnableTOTPResponse>("EnableTOTP", { userId })
}

export function verifyTOTP(userId: string, code: string): Promise<{ ok: boolean }> {
  return call<{ ok: boolean }>("VerifyTOTP", { userId, code })
}

// Email-link flows. Identity exposes these as plain HTTP POSTs (not
// Connect-RPC) because the token always travels in a URL the user clicks.
async function plainPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  const text = await res.text()
  let parsed: unknown
  try {
    parsed = text ? (JSON.parse(text) as unknown) : {}
  } catch {
    parsed = { message: text }
  }
  if (!res.ok) {
    const e = parsed as IdentityErrorBody
    throw new IdentityError(res.status, e.code ?? "unknown", e.message ?? res.statusText)
  }
  return parsed as T
}

export function verifyEmail(token: string): Promise<{ ok: boolean }> {
  return plainPost("/v1/auth/verify-email", { token })
}

export function requestPasswordReset(email: string): Promise<{ ok: boolean }> {
  return plainPost("/v1/auth/request-password-reset", { email })
}

export function confirmPasswordReset(token: string, newPassword: string): Promise<{ ok: boolean }> {
  return plainPost("/v1/auth/confirm-password-reset", { token, newPassword })
}
