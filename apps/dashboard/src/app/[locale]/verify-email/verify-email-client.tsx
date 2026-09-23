"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { ThemeToggle } from "@vettguard/ui/components/theme-toggle"

type State =
  | { kind: "missing" }
  | { kind: "verifying" }
  | { kind: "ok" }
  | { kind: "error"; message: string }

export function VerifyEmailClient({ token }: { token: string }) {
  const [state, setState] = useState<State>(
    token ? { kind: "verifying" } : { kind: "missing" },
  )

  useEffect(() => {
    if (!token) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
        })
        if (cancelled) return
        if (res.ok) {
          setState({ kind: "ok" })
        } else {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          setState({
            kind: "error",
            message:
              body.error ??
              `Verification failed (HTTP ${res.status}). Try requesting a new link.`,
          })
        }
      } catch (err) {
        if (cancelled) return
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Verification failed",
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-8 shadow-[var(--shadow-md)] text-center">
        {state.kind === "missing" && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--fg)]">
              No verification token
            </h1>
            <p className="mt-2 text-sm text-[color:var(--fg-muted)]">
              The link you opened is missing the <code>token</code> parameter.
              Make sure you clicked the exact link from your email.
            </p>
          </>
        )}
        {state.kind === "verifying" && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--fg)]">
              Verifying your email…
            </h1>
            <p className="mt-2 text-sm text-[color:var(--fg-muted)]">
              This usually takes under a second.
            </p>
          </>
        )}
        {state.kind === "ok" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--success)]/10 text-[color:var(--success)]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m4 12 5 5 11-11" />
              </svg>
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-[color:var(--fg)]">
              Email verified
            </h1>
            <p className="mt-2 text-sm text-[color:var(--fg-muted)]">
              You can sign in now.
            </p>
            <Link
              href="/sign-in"
              className="mt-6 inline-block rounded-md bg-[color:var(--fg)] px-4 py-2 text-sm font-medium text-[color:var(--bg)] hover:opacity-90"
            >
              Sign in
            </Link>
          </>
        )}
        {state.kind === "error" && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--fg)]">
              Couldn&apos;t verify
            </h1>
            <p
              className="mt-2 text-sm text-[color:var(--danger)]"
              role="alert"
              aria-live="polite"
            >
              {state.message}
            </p>
            <Link
              href="/sign-in"
              className="mt-6 inline-block text-sm text-[color:var(--accent)] underline"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
