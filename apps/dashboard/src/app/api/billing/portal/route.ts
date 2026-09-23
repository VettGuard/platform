// POST /api/billing/portal — issue a Stripe Customer Portal session.
//
// Reads the tenant id from the access JWT and forwards a Bearer to the
// gateway (gateway re-verifies + populates tenant header). Returns
// `{ url }` for the client to `window.location.href` to.

import { NextResponse } from "next/server"

import { BillingError, getCustomerPortalURL } from "@/lib/billing"
import { currentSession, getAccessToken } from "@/lib/auth"

const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3001"

export async function POST(): Promise<NextResponse> {
  const session = await currentSession()
  const token = await getAccessToken()
  if (!session?.tid || !token) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  try {
    const out = await getCustomerPortalURL(
      session.tid,
      // Where Stripe sends the user when they hit "Back to merchant".
      `${APP_ORIGIN}/settings`,
      token,
    )
    return NextResponse.json({ url: out.url })
  } catch (err) {
    if (err instanceof BillingError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      )
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "portal failed" },
      { status: 500 },
    )
  }
}
