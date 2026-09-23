// POST /api/auth/totp/enable — start the 2FA wizard for the signed-in user.
// Pulls user id from the access JWT claims so the browser can't forge it.

import { NextResponse } from "next/server"

import { currentSession } from "@/lib/auth"
import { enableTOTP, IdentityError } from "@/lib/identity"

export async function POST(): Promise<NextResponse> {
  const session = await currentSession()
  if (!session?.sub) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  try {
    const out = await enableTOTP(session.sub)
    return NextResponse.json(out)
  } catch (err) {
    if (err instanceof IdentityError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      )
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "enable failed" },
      { status: 500 },
    )
  }
}
