import { NextResponse } from "next/server"

import { clearSessionCookies } from "@/lib/auth"

export async function POST(): Promise<NextResponse> {
  // Best-effort cookie clear. We don't call identity.RevokeSession because
  // we don't track session_id in the cookie shape today — Phase 4 follow-up
  // adds that (refresh-token reuse is already auto-revoke at identity-side).
  await clearSessionCookies()
  return NextResponse.json({ ok: true })
}
