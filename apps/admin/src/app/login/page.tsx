// Login page. Sets the vg_admin cookie when the submitted token matches
// ADMIN_TOKEN. Server action means no client JS is needed for the form.

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { COOKIE_NAME, expectedToken } from "@/lib/auth"

async function signIn(formData: FormData) {
  "use server"
  const tokenRaw = formData.get("token")
  const nextRaw = formData.get("next")
  const token = typeof tokenRaw === "string" ? tokenRaw : ""
  const next = typeof nextRaw === "string" && nextRaw ? nextRaw : "/blog"
  if (token !== expectedToken()) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`)
  }
  const c = await cookies()
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12h session
  })
  redirect(next)
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const sp = await searchParams
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form
        action={signIn}
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-8 shadow-[var(--shadow-md)]"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--fg)]">
          VettGuard Admin
        </h1>
        <p className="mt-1 text-sm text-[color:var(--fg-muted)]">
          Enter the admin token. Phase 4 replaces this with Google Workspace SSO.
        </p>
        <label className="mt-6 block">
          <span className="block text-xs font-medium text-[color:var(--fg-muted)]">
            ADMIN_TOKEN
          </span>
          <input
            type="password"
            name="token"
            required
            autoFocus
            autoComplete="off"
            className="mt-1 block w-full rounded-md border border-[color:var(--border)] bg-[color:var(--bg)] px-3 py-2 text-sm text-[color:var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
          />
        </label>
        <input type="hidden" name="next" value={sp.next ?? "/blog"} />
        {sp.error && (
          <p className="mt-3 text-sm text-[color:var(--danger)]">
            Invalid token.
          </p>
        )}
        <button
          type="submit"
          className="mt-6 w-full rounded-md bg-[color:var(--fg)] px-4 py-2 text-sm font-medium text-[color:var(--bg)] hover:opacity-90"
        >
          Sign in
        </button>
        <p className="mt-4 text-center text-xs text-[color:var(--fg-subtle)]">
          Staff access only. All actions are audited.
        </p>
      </form>
    </div>
  )
}
