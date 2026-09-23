import { NextResponse } from "next/server"

import { IdentityError, verifyEmail } from "@/lib/identity"

export async function POST(req: Request): Promise<NextResponse> {
  let body: { token?: string }
  try {
    body = (await req.json()) as { token?: string }
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }
  if (!body.token) {
    return NextResponse.json({ error: "token required" }, { status: 400 })
  }
  try {
    await verifyEmail(body.token)
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
