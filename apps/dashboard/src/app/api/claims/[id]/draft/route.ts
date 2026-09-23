// POST /api/claims/[id]/draft — kick the AI gateway via the claims service
import { NextResponse } from "next/server"

import { getAccessToken } from "@/lib/auth"

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  const res = await fetch(
    `${GATEWAY_URL}/v1/claims/${encodeURIComponent(id)}/draft`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  )
  const body = await res.text()
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": "application/json" },
  })
}
