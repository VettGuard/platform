// POST /api/auth/login — proxy the identity LoginWithEmail call and set
// HttpOnly cookies on success. Errors are forwarded as JSON; the sign-in
// page surfaces the status + code so the user sees something actionable.

import { NextResponse } from "next/server"

import { IdentityError, loginWithEmail } from "@/lib/identity"
import { setSessionCookies } from "@/lib/auth"

type Body = {
  email?: string
  password?: string
  totpCode?: string
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }
  if (!body.email || !body.password) {
    return NextResponse.json({ error: "email + password required" }, { status: 400 })
  }
  try {
    const out = await loginWithEmail({
      email: body.email,
      password: body.password,
      totpCode: body.totpCode,
    })
    await setSessionCookies({
      accessToken: out.accessToken,
      refreshToken: out.refreshToken,
    })
    return NextResponse.json({ ok: true, user: out.user ?? null })
  } catch (err) {
    if (err instanceof IdentityError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      )
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "login failed" },
      { status: 500 },
    )
  }
}
