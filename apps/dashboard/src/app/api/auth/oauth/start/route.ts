// POST /api/auth/oauth/start — kick off an OAuth flow for the given provider.
//
// Flow:
//   1. Client POSTs `{ provider: "google" | "microsoft" }`.
//   2. We call identity StartOAuth → authorize URL + state.
//   3. We set a short-lived cookie remembering the provider — identity's
//      callback receives only `code` + `state`, no provider hint, and our
//      callback page reads the cookie to forward the right provider to
//      CompleteOAuth.
//   4. We return `{ authorizeUrl }`; the client navigates to it.
//
// The `next` query param on the originating page is preserved via a
// second cookie so we can land the user where they were headed.

import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { IdentityError, startOAuth, type OAuthProvider } from "@/lib/identity"

const PROVIDER_COOKIE = "vg_oauth_provider"
const NEXT_COOKIE = "vg_oauth_next"
const SHORT_TTL = 10 * 60 // 10 minutes — long enough for the Google consent click-through

type Body = { provider?: string; next?: string }

function isValidProvider(p: string | undefined): p is OAuthProvider {
  return p === "google" || p === "microsoft"
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  if (!isValidProvider(body.provider)) {
    return NextResponse.json(
      { error: "provider must be 'google' or 'microsoft'" },
      { status: 400 },
    )
  }

  // Build the absolute callback URL the user agent will be redirected back
  // to by Google. Identity has its own configured redirect URL but the proto
  // still asks us for one — we send the canonical app callback.
  const origin = new URL(req.url).origin
  const redirectUri = `${origin}/auth/callback`

  try {
    const out = await startOAuth(body.provider, redirectUri)

    const c = await cookies()
    const opts = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SHORT_TTL,
    }
    c.set({ name: PROVIDER_COOKIE, value: body.provider, ...opts })
    if (body.next && body.next.startsWith("/")) {
      c.set({ name: NEXT_COOKIE, value: body.next, ...opts })
    }

    return NextResponse.json({ authorizeUrl: out.authorizeUrl })
  } catch (err) {
    if (err instanceof IdentityError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      )
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "oauth start failed" },
      { status: 500 },
    )
  }
}
