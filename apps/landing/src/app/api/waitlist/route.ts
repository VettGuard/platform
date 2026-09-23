// POST /api/waitlist — capture landing-page signups.
//
// Hardening: email validation, honeypot, per-IP rate limit, body-size cap.
// Backend path (when GATEWAY_URL is set): forwards to the gateway, which
// upserts into marketing.waitlist_signups (migration in
// services/identity/migrations/) and fans out to the notifier service for
// the double-opt-in email (template = "marketing.waitlist_confirm").
// In dev (no GATEWAY_URL) we log and 200 so the form has a real surface.

import { NextResponse } from "next/server"

const GATEWAY_URL = process.env.GATEWAY_URL ?? ""
const MAX_BODY_BYTES = 2_048

type WaitlistBody = {
  email?: string
  role?: string
  locale?: string
  /** Honeypot. Hidden in the form; humans never fill it, bots always do. */
  company?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// In-memory sliding-window rate limit. 5 attempts / minute / IP.
// This is per-process — fine while we run a single landing instance;
// distributed limiter lands when the gateway hop is live.
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60_000
const hits = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)
  // Opportunistic GC so the Map doesn't grow unbounded.
  if (hits.size > 5_000) {
    for (const [k, ts] of hits) {
      if (ts.length === 0 || now - ts[ts.length - 1]! > RATE_LIMIT_WINDOW_MS) {
        hits.delete(k)
      }
    }
  }
  return false
}

function clientIp(req: Request): string {
  // Trust the first IP in X-Forwarded-For when behind the ingress proxy.
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]!.trim()
  return req.headers.get("x-real-ip") ?? "unknown"
}

export async function POST(req: Request): Promise<NextResponse> {
  // Body-size cap — keep this cheap before parsing JSON.
  const len = Number(req.headers.get("content-length") ?? "0")
  if (len > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 })
  }

  const ip = clientIp(req)
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 })
  }

  let body: WaitlistBody
  try {
    body = (await req.json()) as WaitlistBody
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  // Honeypot — answer 200 ok so the bot thinks it worked, but persist nothing.
  if (body.company && body.company.trim().length > 0) {
    return NextResponse.json({ ok: true })
  }

  const email = body.email?.trim().toLowerCase() ?? ""
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 })
  }
  const role = (body.role ?? "").slice(0, 60)
  const locale = (body.locale ?? "").slice(0, 8)

  if (GATEWAY_URL) {
    try {
      await fetch(`${GATEWAY_URL}/v1/landing/waitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": ip,
        },
        body: JSON.stringify({ email, role, locale, ip }),
        cache: "no-store",
      })
    } catch (err) {
      // Soft-fail: never block the user because our backend is down —
      // we'll backfill from access logs.
      console.error("waitlist: gateway forward failed:", err)
    }
  } else {
    console.warn(
      `waitlist: ${email} (role=${role || "-"}, locale=${locale || "-"}, ip=${ip})`,
    )
  }

  return NextResponse.json({ ok: true })
}
