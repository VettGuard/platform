// GET /api/brokers — list the tenant's vetted brokers.
// Pulls the access JWT from the HttpOnly cookie, forwards it as Bearer
// to the gateway, returns whatever the brokers service replies with.

import { NextResponse } from "next/server"

import { getAccessToken } from "@/lib/auth"

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080"

export async function GET(): Promise<NextResponse> {
  const token = await getAccessToken()
  if (!token) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  const res = await fetch(`${GATEWAY_URL}/v1/brokers`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  const body = await res.text()
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": "application/json" },
  })
}
