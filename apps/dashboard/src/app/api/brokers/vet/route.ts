// POST /api/brokers/vet — vet a new broker (or re-score an existing one).
import { NextResponse } from "next/server"

import { getAccessToken } from "@/lib/auth"

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080"

export async function POST(req: Request): Promise<NextResponse> {
  const token = await getAccessToken()
  if (!token) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  const body = await req.text()
  const res = await fetch(`${GATEWAY_URL}/v1/brokers/vet`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body,
    cache: "no-store",
  })
  const out = await res.text()
  return new NextResponse(out, {
    status: res.status,
    headers: { "content-type": "application/json" },
  })
}
