"use client"

import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"
import { locales, localeNames, type Locale } from "@vettguard/i18n/config"

export function LocaleSwitcher({ current }: { current: Locale }) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  const switchTo = (next: Locale) => {
    const segments = pathname.split("/").filter(Boolean)
    if ((locales as readonly string[]).includes(segments[0] ?? "")) segments.shift()
    const rest = segments.join("/")
    const prefix = next === "en" ? "" : `/${next}`
    const target = `${prefix}/${rest}`.replace(/\/+$/, "") || "/"
    startTransition(() => router.replace(target))
  }

  return (
    <label className="relative">
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        disabled={pending}
        value={current}
        onChange={(e) => switchTo(e.target.value as Locale)}
        className="h-9 cursor-pointer appearance-none rounded-md border border-[color:var(--border)] bg-[color:var(--bg-elevated)] px-3 pr-7 text-sm text-[color:var(--fg)] hover:bg-[color:var(--bg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeNames[loc]}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--fg-muted)]"
      >
        ▾
      </span>
    </label>
  )
}
