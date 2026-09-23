// POST /api/auth/signup — proxy identity.SignUpWithEmail.
//
// On success the identity service creates the tenant + owner-membership +
// email-verification token, and the notifier (stub-logged in dev) sends
// the verify link. The dashboard does NOT log the user in here — they have
// to verify their email first (Login enforces EmailNotVerified).

import { NextResponse } from "next/server"

import { IdentityError, signUpWithEmail } from "@/lib/identity"

type Body = {
  email?: string
  password?: string
  fullName?: string
  tenantName?: string
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }
  const email = body.email?.trim() ?? ""
  const password = body.password ?? ""
  const fullName = body.fullName?.trim() ?? ""
  const tenantName = body.tenantName?.trim() ?? ""

  if (!email || !password || !fullName || !tenantName) {
    return NextResponse.json(
      { error: "email, password, fullName, tenantName all required" },
      { status: 400 },
    )
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "password must be at least 8 characters" }, { status: 400 })
  }

  try {
    const out = await signUpWithEmail({ email, password, fullName, tenantName })
    return NextResponse.json({ ok: true, user: out.user ?? null, tenant: out.tenant ?? null })
  } catch (err) {
    if (err instanceof IdentityError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      )
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "signup failed" },
      { status: 500 },
    )
  }
}
