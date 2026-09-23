// GET  /api/claims      — list tenant's claims (newest first)
// POST /api/claims      — create a new draft-status claim

import { NextResponse } from "next/server"

import { getAccessToken } from "@/lib/auth"

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080"

async function proxy(req: Request, method: "GET" | "POST"): Promise<NextResponse> {
  const token = await getAccessToken()
  if (!token) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  const init: RequestInit = {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(method === "POST" ? { "content-type": "application/json" } : {}),
    },
    cache: "no-store",
  }
  if (method === "POST") {
    init.body = await req.text()
  }
  const res = await fetch(`${GATEWAY_URL}/v1/claims`, init)
  const body = await res.text()
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": "application/json" },
  })
}

export async function GET(req: Request): Promise<NextResponse> {
  return proxy(req, "GET")
}
export async function POST(req: Request): Promise<NextResponse> {
  return proxy(req, "POST")
}
