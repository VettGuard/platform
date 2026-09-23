// Session helpers — read/write the auth cookies and decode the access JWT.
//
// We keep both tokens server-side in HttpOnly cookies so the client JS
// never sees them (XSS guard). The access cookie carries the Ed25519 JWT
// minted by the identity service; we decode its payload locally for cheap
// claims reads (sub, tid, role, exp) without a network round-trip.
//
// Cryptographic verification of the JWT happens at the gateway. The dashboard
// trusts the cookie because:
//   - It's HttpOnly + SameSite=Lax, so only set-cookie from our own /api routes
//   - The /api/auth/login route only sets it after the gateway returns 2xx
// If a savvier attacker could forge a cookie they could already MITM the
// browser; we'd lose either way.

import { cookies } from "next/headers"
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies"

export const ACCESS_COOKIE = "vg_access"
export const REFRESH_COOKIE = "vg_refresh"

// Access JWT is 15 min in identity; refresh is 7 days sliding.
// We mirror those lifetimes on the cookie so the browser cleans up after itself.
const ACCESS_MAX_AGE = 15 * 60
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60

export type AccessClaims = {
  sub?: string // user id
  tid?: string // tenant id
  role?: string // owner|admin|dispatcher|viewer
  jti?: string
  iat?: number
  exp?: number
  iss?: string
}

const baseCookieOpts = (): Partial<ResponseCookie> => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
})

export async function setSessionCookies(opts: {
  accessToken: string
  refreshToken: string
}): Promise<void> {
  const c = await cookies()
  c.set({
    name: ACCESS_COOKIE,
    value: opts.accessToken,
    maxAge: ACCESS_MAX_AGE,
    ...baseCookieOpts(),
  })
  c.set({
    name: REFRESH_COOKIE,
    value: opts.refreshToken,
    maxAge: REFRESH_MAX_AGE,
    ...baseCookieOpts(),
  })
}

export async function clearSessionCookies(): Promise<void> {
  const c = await cookies()
  c.delete(ACCESS_COOKIE)
  c.delete(REFRESH_COOKIE)
}

export async function getAccessToken(): Promise<string | null> {
  const c = await cookies()
  return c.get(ACCESS_COOKIE)?.value ?? null
}

export async function getRefreshToken(): Promise<string | null> {
  const c = await cookies()
  return c.get(REFRESH_COOKIE)?.value ?? null
}

// Decode the JWT payload (no signature check — the gateway does that).
// Returns null for malformed tokens.
export function decodeAccessClaims(token: string): AccessClaims | null {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  try {
    // base64url → base64
    const b64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/")
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4)
    const json = Buffer.from(padded, "base64").toString("utf8")
    return JSON.parse(json) as AccessClaims
  } catch {
    return null
  }
}

// Returns the current session claims or null when unauthenticated /
// the cookie has decayed. Server-only helper.
export async function currentSession(): Promise<AccessClaims | null> {
  const access = await getAccessToken()
  if (!access) return null
  const claims = decodeAccessClaims(access)
  if (!claims) return null
  // Token-expiry guard: 15-min access JWTs can outlive their cookie maxAge
  // by a few seconds if the user's clock drifts. Cheap exp check protects
  // server components from rendering stale identity.
  if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) {
    return null
  }
  return claims
}
