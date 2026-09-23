"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { Button } from "@vettguard/ui/components/button"
import { ThemeToggle } from "@vettguard/ui/components/theme-toggle"

type Status = "idle" | "submitting" | "error"

export function SignUpForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [tenantName, setTenantName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMsg("")
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, tenantName, email, password }),
      })
      if (res.ok) {
        router.replace(`/verify-email-sent?email=${encodeURIComponent(email)}`)
        return
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      setStatus("error")
      setErrorMsg(body.error ?? `HTTP ${res.status}`)
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Sign up failed")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-8 shadow-[var(--shadow-md)]"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--fg)]">
          Create your VettGuard account
        </h1>
        <p className="mt-1 text-sm text-[color:var(--fg-muted)]">
          Start vetting brokers and recovering detention. We&apos;ll email a
          verification link before you can sign in.
        </p>

        <Field label="Your name">
          <input
            type="text"
            required
            autoFocus
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={status === "submitting"}
            className={fieldClass}
            placeholder="Alex Mansurov"
          />
        </Field>
        <Field label="Carrier / company name">
          <input
            type="text"
            required
            autoComplete="organization"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            disabled={status === "submitting"}
            className={fieldClass}
            placeholder="Mansurov Logistics LLC"
          />
        </Field>
        <Field label="Work email">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "submitting"}
            className={fieldClass}
            placeholder="you@yourcarrier.com"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={status === "submitting"}
            className={fieldClass}
            placeholder="At least 8 characters"
          />
        </Field>

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
          {status === "submitting" ? "Creating account…" : "Create account"}
        </Button>

        <p className="mt-6 text-center text-sm text-[color:var(--fg-muted)]">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-[color:var(--accent)] underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}

const fieldClass =
  "mt-1 block h-10 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--bg)] px-3 text-sm text-[color:var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="mt-4 block">
      <span className="block text-xs font-medium text-[color:var(--fg-muted)]">
        {label}
      </span>
      {children}
    </label>
  )
}
