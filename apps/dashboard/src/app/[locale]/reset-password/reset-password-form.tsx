"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { Button } from "@vettguard/ui/components/button"
import { ThemeToggle } from "@vettguard/ui/components/theme-toggle"

type Status = "idle" | "submitting" | "ok" | "error"

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  if (!token) {
    return (
      <Shell title="Missing token">
        <p className="mt-2 text-sm text-[color:var(--fg-muted)]">
          The reset link is missing its token. Request a new one from the
          forgot-password page.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm font-medium text-[color:var(--accent)] underline"
        >
          Request a new link
        </Link>
      </Shell>
    )
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (password.length < 8) {
      setStatus("error")
      setErrorMsg("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setStatus("error")
      setErrorMsg("Passwords don't match.")
      return
    }
    setStatus("submitting")
    setErrorMsg("")
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      setStatus("ok")
      // Sessions are revoked server-side; route to sign-in.
      setTimeout(() => router.replace("/sign-in"), 1200)
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Reset failed")
    }
  }

  if (status === "ok") {
    return (
      <Shell title="Password updated">
        <p className="mt-2 text-sm text-[color:var(--fg-muted)]">
          Your password has been changed. We&apos;ve signed out every other
          session. Redirecting you to sign in…
        </p>
      </Shell>
    )
  }

  return (
    <Shell title="Set a new password">
      <p className="mt-1 text-sm text-[color:var(--fg-muted)]">
        Choose something at least 8 characters. We&apos;ll revoke every
        existing session on this account.
      </p>
      <form onSubmit={onSubmit}>
        <label className="mt-6 block">
          <span className="block text-xs font-medium text-[color:var(--fg-muted)]">
            New password
          </span>
          <input
            type="password"
            required
            autoFocus
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={status === "submitting"}
            className="mt-1 block h-10 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--bg)] px-3 text-sm text-[color:var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
          />
        </label>
        <label className="mt-4 block">
          <span className="block text-xs font-medium text-[color:var(--fg-muted)]">
            Confirm new password
          </span>
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={status === "submitting"}
            className="mt-1 block h-10 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--bg)] px-3 text-sm text-[color:var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
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
          {status === "submitting" ? "Updating…" : "Update password"}
        </Button>
      </form>
    </Shell>
  )
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-8 shadow-[var(--shadow-md)]">
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--fg)]">
          {title}
        </h1>
        {children}
      </div>
    </div>
  )
}
