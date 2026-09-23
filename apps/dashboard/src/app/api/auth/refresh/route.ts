// POST /api/auth/refresh — uses the HttpOnly refresh cookie to mint a new
// access token. Called by client code when an API call returns 401 (the
// access JWT lives 15 min; the refresh token rotates each call and lives
// up to 7 days sliding).

import { NextResponse } from "next/server"

import {
  clearSessionCookies,
  getRefreshToken,
  setSessionCookies,
} from "@/lib/auth"
import { IdentityError, refreshSession } from "@/lib/identity"

export async function POST(): Promise<NextResponse> {
  const refresh = await getRefreshToken()
  if (!refresh) {
    return NextResponse.json({ error: "no refresh token" }, { status: 401 })
  }
  try {
    const out = await refreshSession(refresh)
    await setSessionCookies({
      accessToken: out.accessToken,
      refreshToken: out.refreshToken,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    // Identity returns Unauthenticated on revoked / replayed / expired refresh
    // — clear cookies so the next page load redirects to /sign-in.
    if (err instanceof IdentityError && err.status === 401) {
      await clearSessionCookies()
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "refresh failed" },
      { status: err instanceof IdentityError ? err.status : 500 },
    )
  }
}
