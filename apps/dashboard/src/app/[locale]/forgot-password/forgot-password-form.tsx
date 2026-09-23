"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"

import { Button } from "@vettguard/ui/components/button"
import { ThemeToggle } from "@vettguard/ui/components/theme-toggle"

type Status = "idle" | "submitting" | "ok" | "error"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMsg("")
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      setStatus("ok")
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Reset request failed")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-8 shadow-[var(--shadow-md)]"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--fg)]">
          Forgot your password?
        </h1>
        <p className="mt-1 text-sm text-[color:var(--fg-muted)]">
          We&apos;ll email you a link to set a new one. The link expires in 1
          hour.
        </p>

        {status === "ok" ? (
          <div className="mt-6 rounded-md border border-[color:var(--border)] bg-[color:var(--bg)] p-4 text-sm text-[color:var(--fg)]">
            <strong>Check your inbox.</strong> If an account exists for{" "}
            <span className="font-mono">{email}</span>, a password-reset link
            is on its way. Identity always returns success here so attackers
            can&apos;t enumerate accounts — if you don&apos;t see it in a few
            minutes, check spam or{" "}
            <Link
              href="/sign-up"
              className="text-[color:var(--accent)] underline"
            >
              create an account
            </Link>
            .
          </div>
        ) : (
          <>
            <label className="mt-6 block">
              <span className="block text-xs font-medium text-[color:var(--fg-muted)]">
                Email
              </span>
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "submitting"}
                className="mt-1 block h-10 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--bg)] px-3 text-sm text-[color:var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                placeholder="you@yourcarrier.com"
              />
            </label>

            {status === "error" && (
              <p
                className="mt-3 text-sm text-[color:var(--danger)]"
                role="alert"
                aria-live="polite"
              >
                {errorMsg}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={status === "submitting"}
              className="mt-6 w-full"
            >
              {status === "submitting" ? "Sending…" : "Send reset link"}
            </Button>
          </>
        )}

        <p className="mt-6 text-center text-sm text-[color:var(--fg-muted)]">
          Remembered it?{" "}
          <Link
            href="/sign-in"
            className="text-[color:var(--accent)] underline"
          >
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
