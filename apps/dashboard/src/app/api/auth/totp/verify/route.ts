// POST /api/auth/totp/verify — confirm the 6-digit code from the user's
// authenticator app. Identity flips the factor to `verified` on success.

import { NextResponse } from "next/server"

import { currentSession } from "@/lib/auth"
import { IdentityError, verifyTOTP } from "@/lib/identity"

type Body = { code?: string }

export async function POST(req: Request): Promise<NextResponse> {
  const session = await currentSession()
  if (!session?.sub) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }
  if (!body.code || !/^\d{6}$/.test(body.code)) {
    return NextResponse.json(
      { error: "code must be 6 digits" },
      { status: 400 },
    )
  }
  try {
    await verifyTOTP(session.sub, body.code)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof IdentityError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      )
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "verify failed" },
      { status: 500 },
    )
  }
}
