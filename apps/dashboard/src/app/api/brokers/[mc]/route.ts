// GET /api/brokers/[mc] — single broker detail by MC number.
import { NextResponse } from "next/server"

import { getAccessToken } from "@/lib/auth"

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mc: string }> },
): Promise<NextResponse> {
  const { mc } = await params
  const token = await getAccessToken()
  if (!token) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  const res = await fetch(
    `${GATEWAY_URL}/v1/brokers/${encodeURIComponent(mc)}`,
    {
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
