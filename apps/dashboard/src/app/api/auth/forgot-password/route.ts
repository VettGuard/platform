// POST /api/auth/forgot-password — proxy to identity RequestPasswordReset.
// Identity always returns success (so attackers can't enumerate accounts),
// so we only surface real failures here.

import { NextResponse } from "next/server"

import { IdentityError, requestPasswordReset } from "@/lib/identity"

type Body = { email?: string }

export async function POST(req: Request): Promise<NextResponse> {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }
  if (!body.email) {
    return NextResponse.json({ error: "email required" }, { status: 400 })
  }
  try {
    await requestPasswordReset(body.email)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof IdentityError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      )
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "request failed" },
      { status: 500 },
    )
  }
}
