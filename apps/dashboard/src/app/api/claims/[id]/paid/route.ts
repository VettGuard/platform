// POST /api/claims/[id]/paid — mark a sent claim as recovered
import { NextResponse } from "next/server"

import { getAccessToken } from "@/lib/auth"

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const token = await getAccessToken()
  if (!token) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  const body = await req.text()
  const res = await fetch(
    `${GATEWAY_URL}/v1/claims/${encodeURIComponent(id)}/paid`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body,
      cache: "no-store",
    },
  )
  const out = await res.text()
  return new NextResponse(out, {
    status: res.status,
    headers: { "content-type": "application/json" },
  })
}
