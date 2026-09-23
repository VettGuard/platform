import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { COOKIE_NAME } from "@/lib/auth"

export async function POST(): Promise<NextResponse> {
  const c = await cookies()
  c.delete(COOKIE_NAME)
  return NextResponse.json({ ok: true })
}
