"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { Button } from "@vettguard/ui/components/button"
import { ThemeToggle } from "@vettguard/ui/components/theme-toggle"

type Status = "idle" | "submitting" | "error"

type OAuthProvider = "google" | "microsoft"

export function SignInForm({ next }: { next: string }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [totp, setTotp] = useState("")
  const [needsTotp, setNeedsTotp] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [oauthPending, setOauthPending] = useState<OAuthProvider | null>(null)

  async function startOAuth(provider: OAuthProvider) {
    setOauthPending(provider)
    setErrorMsg("")
    try {
      const res = await fetch("/api/auth/oauth/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, next }),
      })
      const body = (await res.json().catch(() => ({}))) as {
        authorizeUrl?: string
        error?: string
      }
      if (!res.ok || !body.authorizeUrl) {
        throw new Error(body.error ?? `OAuth start failed (${res.status})`)
      }
      window.location.href = body.authorizeUrl
    } catch (err) {
      setOauthPending(null)
      setErrorMsg(err instanceof Error ? err.message : "OAuth start failed")
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMsg("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, totpCode: totp || undefined }),
      })
      if (res.ok) {
        router.replace(next)
        router.refresh()
        return
      }
      const body = (await res.json().catch(() => ({}))) as {
        error?: string
        code?: string
      }
      // Identity signals "totp_code required" via Unauthenticated +
      // an explicit message string. Detect and show the TOTP input.
      if (
        res.status === 401 &&
        (body.error ?? "").toLowerCase().includes("totp")
      ) {
        setNeedsTotp(true)
        setStatus("idle")
        return
      }
      setStatus("error")
      setErrorMsg(body.error ?? `HTTP ${res.status}`)
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Sign in failed")
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
          Sign in to VettGuard
        </h1>
        <p className="mt-1 text-sm text-[color:var(--fg-muted)]">
          The dispatcher's copilot. Use your email and password.
        </p>

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
        <label className="mt-4 block">
          <span className="block text-xs font-medium text-[color:var(--fg-muted)]">
            Password
          </span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={status === "submitting"}
            className="mt-1 block h-10 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--bg)] px-3 text-sm text-[color:var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
          />
        </label>

        {needsTotp && (
          <label className="mt-4 block">
            <span className="block text-xs font-medium text-[color:var(--fg-muted)]">
              2FA code
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              required
              value={totp}
              onChange={(e) => setTotp(e.target.value)}
              disabled={status === "submitting"}
              className="mt-1 block h-10 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--bg)] px-3 font-mono text-sm tracking-[0.3em] text-[color:var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
              placeholder="000000"
            />
          </label>
        )}

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
          disabled={status === "submitting" || oauthPending !== null}
          className="mt-6 w-full"
        >
          {status === "submitting" ? "Signing in…" : "Sign in"}
        </Button>

        <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-subtle)]">
          <div className="h-px flex-1 bg-[color:var(--border)]" />
          or
          <div className="h-px flex-1 bg-[color:var(--border)]" />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void startOAuth("google")}
            disabled={oauthPending !== null || status === "submitting"}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--bg)] text-sm font-medium text-[color:var(--fg)] hover:bg-[color:var(--bg-subtle)] disabled:opacity-50"
          >
            <GoogleGlyph />
            {oauthPending === "google" ? "Redirecting…" : "Continue with Google"}
          </button>
          <button
            type="button"
            onClick={() => void startOAuth("microsoft")}
            disabled={oauthPending !== null || status === "submitting"}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--bg)] text-sm font-medium text-[color:var(--fg)] hover:bg-[color:var(--bg-subtle)] disabled:opacity-50"
          >
            <MicrosoftGlyph />
            {oauthPending === "microsoft" ? "Redirecting…" : "Continue with Microsoft"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-[color:var(--fg-muted)]">
          New to VettGuard?{" "}
          <Link href="/sign-up" className="text-[color:var(--accent)] underline">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-[color:var(--fg-subtle)]">
          <Link
            href="/forgot-password"
            className="text-[color:var(--fg-muted)] underline"
          >
            Forgot password?
          </Link>
        </p>
      </form>
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  )
}

function MicrosoftGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <rect width="8" height="8" fill="#F25022" />
      <rect x="10" width="8" height="8" fill="#7FBA00" />
      <rect y="10" width="8" height="8" fill="#00A4EF" />
      <rect x="10" y="10" width="8" height="8" fill="#FFB900" />
    </svg>
  )
}
