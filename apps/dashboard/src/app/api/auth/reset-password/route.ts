// POST /api/auth/reset-password — proxy to identity ConfirmPasswordReset.
// Server-side identity revokes every existing session on success, so we
// also clear our cookies here.

import { NextResponse } from "next/server"

import { clearSessionCookies } from "@/lib/auth"
import { confirmPasswordReset, IdentityError } from "@/lib/identity"

type Body = { token?: string; newPassword?: string }

export async function POST(req: Request): Promise<NextResponse> {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }
  if (!body.token || !body.newPassword) {
    return NextResponse.json(
      { error: "token + newPassword required" },
      { status: 400 },
    )
  }
  if (body.newPassword.length < 8) {
    return NextResponse.json(
      { error: "password must be at least 8 characters" },
      { status: 400 },
    )
  }
  try {
    await confirmPasswordReset(body.token, body.newPassword)
    await clearSessionCookies()
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof IdentityError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      )
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "reset failed" },
      { status: 500 },
    )
  }
}
