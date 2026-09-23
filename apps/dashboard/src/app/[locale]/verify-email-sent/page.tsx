import Link from "next/link"
import { setRequestLocale } from "next-intl/server"

import { ThemeToggle } from "@vettguard/ui/components/theme-toggle"

export default async function VerifyEmailSent({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ email?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const sp = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-8 shadow-[var(--shadow-md)] text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-[color:var(--fg)]">
          Check your inbox
        </h1>
        <p className="mt-2 text-sm text-[color:var(--fg-muted)]">
          We sent a verification link to{" "}
          {sp.email ? (
            <strong className="text-[color:var(--fg)]">{sp.email}</strong>
          ) : (
            "your email"
          )}
          . Click it to activate your account, then sign in.
        </p>
        <p className="mt-6 text-xs text-[color:var(--fg-subtle)]">
          Didn&apos;t get the email? Check spam, or sign up again with a
          different address.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-block text-sm text-[color:var(--accent)] underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
