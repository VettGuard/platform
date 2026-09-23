"use client"

// Customer dashboard sidebar — port of docs/design/reference/project/customer.jsx CustSidebar.
// Reads active route from usePathname so server-side rendering doesn't
// need an `active` prop. Locale prefix is stripped before matching.

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"

import { Avatar, Btn, FF, Ic, Mark, Pill, T } from "@/components/dash/dsl"

type NavItem = {
  id: string
  href: string
  label: string
  icon: React.ReactNode
  count?: string
  tone?: "primary" | "neutral"
}

const NAV: NavItem[] = [
  { id: "overview", href: "/",         label: "Overview", icon: Ic.home },
  { id: "brokers",  href: "/brokers",  label: "Brokers",  icon: Ic.shield, count: "318" },
  { id: "claims",   href: "/claims",   label: "Claims",   icon: Ic.doc, count: "24", tone: "primary" },
  { id: "settings", href: "/settings", label: "Settings", icon: Ic.cog },
]

function withLocale(locale: string, href: string): string {
  // en is the default locale and lives at the unprefixed root.
  const prefix = locale === "en" ? "" : `/${locale}`
  return href === "/" ? prefix || "/" : `${prefix}${href}`
}

function activeId(locale: string, pathname: string): string {
  // Strip locale prefix then match. `/uz/brokers` → `/brokers`.
  let p = pathname
  if (locale !== "en" && p.startsWith(`/${locale}`)) {
    p = p.slice(locale.length + 1) || "/"
  }
  if (p === "" || p === "/") return "overview"
  for (const n of NAV) {
    if (n.href !== "/" && p.startsWith(n.href)) return n.id
  }
  return "overview"
}

export function Sidebar({ role: _role }: { role: string }) {
  const pathname = usePathname() ?? "/"
  const params = useParams<{ locale: string }>()
  const locale = params?.locale ?? "en"
  const active = activeId(locale, pathname)

  return (
    <aside
      style={{
        width: 220,
        background: T.surfaceAlt,
        borderRight: `1px solid ${T.border}`,
        padding: "20px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        fontFamily: FF.sans,
        color: T.text,
        flexShrink: 0,
        minHeight: "100vh",
      }}
    >
      <Mark size={22} href={withLocale(locale, "/")} />

      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
        {NAV.map((n) => {
          const a = active === n.id
          return (
            <Link
              key={n.id}
              href={withLocale(locale, n.href)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 4,
                background: a ? T.orangeTint : "transparent",
                borderLeft: `2px solid ${a ? T.orange : "transparent"}`,
                marginLeft: -2,
                color: a ? T.text : T.textDim,
                fontSize: 13.5,
                cursor: "pointer",
                fontWeight: a ? 500 : 400,
                textDecoration: "none",
                transition: "background 160ms ease, color 160ms ease",
              }}
            >
              <span style={{ color: a ? T.orange : T.textMute, display: "flex" }}>
                {n.icon}
              </span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.count && <Pill tone={n.tone ?? "neutral"}>{n.count}</Pill>}
            </Link>
          )
        })}
      </div>

      <div style={{ marginTop: 6 }}>
        <div
          style={{
            fontFamily: FF.mono,
            fontSize: 10,
            color: T.textMute,
            letterSpacing: "0.1em",
            padding: "0 10px 6px",
            textTransform: "uppercase",
          }}
        >
          AI assistant
        </div>
        <div
          style={{
            margin: "0 4px",
            padding: 12,
            background: T.orangeTint,
            color: T.text,
            borderRadius: 8,
            border: `1px solid ${T.borderStrong}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: FF.mono,
              fontSize: 9.5,
              color: T.orangeDeep,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {Ic.sparkle} Today
          </div>
          <div style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.4, color: T.text }}>
            3 claims auto-drafted. 1 broker flagged on your active board.
          </div>
          <Btn
            variant="primary"
            size="sm"
            href={withLocale(locale, "/claims")}
            style={{ marginTop: 10, width: "100%", justifyContent: "center" }}
          >
            Review queue
          </Btn>
        </div>
      </div>

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 4px",
        }}
      >
        <Avatar initials="DR" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500 }}>Diyor R.</div>
          <div style={{ fontFamily: FF.mono, fontSize: 10, color: T.textMute }}>
            Northridge Freight
          </div>
        </div>
        <span style={{ color: T.textMute }}>{Ic.more}</span>
      </div>
    </aside>
  )
}
