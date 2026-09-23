import createMiddleware from "next-intl/middleware"
import { NextResponse, type NextRequest } from "next/server"

import { routing } from "./i18n/routing"
import { COOKIE_NAME, expectedToken } from "./lib/auth"

const intl = createMiddleware(routing)

// Routes that require the admin token cookie. Everything else (login page,
// static assets) is public so we can render the login form without a loop.
// New internal-team console: customers/brokers/ai-ops/revenue/support also
// gated. Root `/` is also a console page (Customers) — gated.
const PROTECTED_PREFIXES = [
  "/blog",
  "/customers",
  "/brokers",
  "/ai-ops",
  "/revenue",
  "/support",
]
const PROTECTED_API_PREFIXES = ["/api/posts", "/api/upload"]

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // API: gate behind the cookie; no i18n needed.
  if (PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    const cookie = req.cookies.get(COOKIE_NAME)?.value
    if (!cookie || cookie !== expectedToken()) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Pages: strip locale prefix when checking the path.
  const localeStripped = pathname.replace(/^\/(en|uz|ru|es|tr|uk)(?=\/|$)/, "")
  const needsAuth = PROTECTED_PREFIXES.some((p) => localeStripped.startsWith(p))
  if (needsAuth) {
    const cookie = req.cookies.get(COOKIE_NAME)?.value
    if (!cookie || cookie !== expectedToken()) {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }
  }

  return intl(req)
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
}
