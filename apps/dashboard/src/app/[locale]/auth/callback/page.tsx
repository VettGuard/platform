// /auth/callback — OAuth callback landing.
//
// The browser arrives here after the user consents at Google/Microsoft.
// Query params: `code` + `state` (and possibly `error` if the user cancelled).
// We pull the provider from the `vg_oauth_provider` cookie (set on /start),
// call identity CompleteOAuth, set session cookies, and bounce to the
// originating `next` path (default `/`).
//
// We render a tiny "Signing you in…" surface so the user sees something
// while the round-trip happens; if anything fails we render the error and
// link back to /sign-in.

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { setSessionCookies } from "@/lib/auth"
import { completeOAuth, IdentityError, type OAuthProvider } from "@/lib/identity"

const PROVIDER_COOKIE = "vg_oauth_provider"
const NEXT_COOKIE = "vg_oauth_next"

type Search = { code?: string; state?: string; error?: string; error_description?: string }

function isProvider(v: string | undefined): v is OAuthProvider {
  return v === "google" || v === "microsoft"
}

export default async function OAuthCallback({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Search>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const sp = await searchParams

  // User cancelled or upstream errored — render the message; no redirect.
  if (sp.error) {
    return (
      <ErrorPanel
        title="Sign-in cancelled"
        message={sp.error_description || sp.error}
      />
    )
  }
  if (!sp.code || !sp.state) {
    return <ErrorPanel title="Missing OAuth response" message="No code/state on callback URL." />
  }

  const c = await cookies()
  const provider = c.get(PROVIDER_COOKIE)?.value
  if (!isProvider(provider)) {
    return (
      <ErrorPanel
        title="OAuth session expired"
        message="The sign-in window timed out. Start again from the sign-in page."
      />
    )
  }
  const next = c.get(NEXT_COOKIE)?.value
  // Clear the one-shot cookies regardless of outcome.
  c.delete(PROVIDER_COOKIE)
  c.delete(NEXT_COOKIE)

  let result
  try {
    result = await completeOAuth(provider, sp.code, sp.state)
  } catch (err) {
    const message =
      err instanceof IdentityError
        ? `${err.code}: ${err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown error"
    return <ErrorPanel title="Sign-in failed" message={message} />
  }

  // Brand-new OAuth users without a tenant membership get no tokens.
  // Send them through onboarding (placeholder — currently /sign-up with a hint).
  if (!result.accessToken || !result.refreshToken) {
    redirect(
      `/sign-up?oauth=${provider}&email=${encodeURIComponent(result.user?.email ?? "")}`,
    )
  }

  await setSessionCookies({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  })

  const dest = next && next.startsWith("/") ? next : "/"
  redirect(dest)
}

function ErrorPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-8 shadow-[var(--shadow-md)]">
        <h1 className="text-xl font-semibold tracking-tight text-[color:var(--fg)]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-[color:var(--fg-muted)]">{message}</p>
        <a
          href="/sign-in"
          className="mt-6 inline-block text-sm font-medium text-[color:var(--accent)] underline"
        >
          Back to sign-in
        </a>
      </div>
    </div>
  )
}
