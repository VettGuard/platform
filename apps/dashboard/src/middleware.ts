import createMiddleware from "next-intl/middleware"
import { NextResponse, type NextRequest } from "next/server"

import { ACCESS_COOKIE } from "./lib/auth"
import { routing } from "./i18n/routing"

const intl = createMiddleware(routing)

// Paths inside a locale segment that are public (no auth required).
// We don't include `/api/auth/*` here because /api/* is excluded by the
// matcher entirely — the cookie reads happen inside the route handlers.
const PUBLIC_PATHS = new Set([
  "/sign-in",
  "/sign-up",
  "/verify-email",
  "/verify-email-sent",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
])

export default function middleware(req: NextRequest) {
  const url = req.nextUrl
  const path = url.pathname

  // Strip leading /<locale> prefix for routing decisions. Keep locale around
  // so we can build a same-locale redirect target.
  const localeMatch = /^\/(en|uz|ru|es|tr|uk)(?=\/|$)/.exec(path)
  const locale = localeMatch ? localeMatch[1] : "en"
  const localePrefix = locale === "en" ? "" : `/${locale}`
  const localeStripped = localeMatch
    ? path.slice(localeMatch[0].length) || "/"
    : path

  const hasAccess = Boolean(req.cookies.get(ACCESS_COOKIE)?.value)
  const isPublic = PUBLIC_PATHS.has(localeStripped)

  // Already signed in → /sign-in bounces back to the destination.
  // /auth/callback is an exception: the user may already be authed (the
  // cookie set by an in-flight callback is visible to subsequent requests),
  // and the page itself does the final routing — bouncing here would skip
  // the OAuth completion logic.
  if (isPublic && hasAccess && localeStripped !== "/auth/callback") {
    const next = url.searchParams.get("next") ?? "/"
    const target = url.clone()
    target.pathname = `${localePrefix}${next}`
    target.search = ""
    return NextResponse.redirect(target)
  }

  // Protected route + no cookie → /sign-in?next=…
  if (!isPublic && !hasAccess) {
    const target = url.clone()
    target.pathname = `${localePrefix}/sign-in`
    target.search = `?next=${encodeURIComponent(localeStripped)}`
    return NextResponse.redirect(target)
  }

  return intl(req)
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
