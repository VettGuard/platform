"use client"

// Customer dashboard topbar — port of docs/design/reference/project/customer.jsx CustTopbar.
// Page meta (title/sub/action) flips per route. Lightweight: derives meta
// from pathname so each page route doesn't need to re-pass it.

import { useRouter, useParams, usePathname } from "next/navigation"
import { useMemo, useState } from "react"

import { ThemeToggle } from "@vettguard/ui/components/theme-toggle"
import { Btn, FF, Ic, T } from "@/components/dash/dsl"

type Meta = { title: string; sub: string; ctaLabel: string | null; ctaHref: string | null }

function metaForPath(path: string, locale: string): Meta {
  let p = path
  if (locale !== "en" && p.startsWith(`/${locale}`)) {
    p = p.slice(locale.length + 1) || "/"
  }
  if (p === "/" || p === "")
    return { title: "Overview", sub: "Workspace · Northridge Freight", ctaLabel: "New claim", ctaHref: "/claims" }
  if (p.startsWith("/brokers"))
    return { title: "Brokers", sub: "318 vetted by AI", ctaLabel: "Vet a broker", ctaHref: "/brokers" }
  if (p.startsWith("/claims"))
    return { title: "Claims", sub: "188 lifetime · $84.2k recovered", ctaLabel: "New claim", ctaHref: "/claims" }
  if (p.startsWith("/settings"))
    return { title: "Settings", sub: "Workspace preferences", ctaLabel: null, ctaHref: null }
  return { title: "Dashboard", sub: "", ctaLabel: null, ctaHref: null }
}

function withLocale(locale: string, href: string): string {
  const prefix = locale === "en" ? "" : `/${locale}`
  return href === "/" ? prefix || "/" : `${prefix}${href}`
}

export function TopBar({
  userId: _userId,
  tenantId: _tenantId,
}: {
  userId: string
  tenantId: string
}) {
  const router = useRouter()
  const pathname = usePathname() ?? "/"
  const params = useParams<{ locale: string }>()
  const locale = params?.locale ?? "en"
  const meta = useMemo(() => metaForPath(pathname, locale), [pathname, locale])
  const [pending, setPending] = useState(false)

  async function logout() {
    setPending(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.replace("/sign-in")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 28px",
        borderBottom: `1px solid ${T.border}`,
        background: T.bg,
        fontFamily: FF.sans,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {meta.sub && (
          <div
            style={{
              fontFamily: FF.mono,
              fontSize: 11,
              color: T.textMute,
              letterSpacing: "0.06em",
            }}
          >
            {meta.sub}
          </div>
        )}
        <div
          style={{
            fontFamily: FF.display,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "-0.015em",
            marginTop: 2,
            color: T.text,
          }}
        >
          {meta.title}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 12px",
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          width: 300,
          color: T.textDim,
        }}
      >
        {Ic.search}
        <span style={{ fontSize: 13 }}>Search broker, MC#, claim…</span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: FF.mono,
            fontSize: 10,
            padding: "1px 5px",
            border: `1px solid ${T.border}`,
            borderRadius: 2,
            color: T.textMute,
          }}
        >
          ⌘K
        </span>
      </div>

      <button
        type="button"
        aria-label="Notifications"
        style={{
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          position: "relative",
          color: T.textDim,
          cursor: "pointer",
        }}
      >
        {Ic.bell}
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 7,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: T.orange,
            border: `2px solid ${T.bg}`,
          }}
        />
      </button>

      <ThemeToggle />

      {meta.ctaLabel && meta.ctaHref && (
        <Btn variant="primary" size="md" href={withLocale(locale, meta.ctaHref)}>
          {Ic.plus} {meta.ctaLabel}
        </Btn>
      )}

      <button
        type="button"
        onClick={logout}
        disabled={pending}
        style={{
          height: 36,
          padding: "0 12px",
          background: "transparent",
          border: `1px solid ${T.border}`,
          borderRadius: 6,
          color: T.text,
          fontSize: 12.5,
          fontFamily: FF.sans,
          cursor: pending ? "wait" : "pointer",
          opacity: pending ? 0.5 : 1,
        }}
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </header>
  )
}
