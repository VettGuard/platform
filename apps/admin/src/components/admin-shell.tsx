"use client"

// Admin shell — sidebar + topbar shared across the 5 internal pages.
// Port of docs/design/reference/project/admin.jsx (AdminSidebar + AdminTopbar).

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import type { ReactNode } from "react"

import { Avatar, Btn, FF, Ic, Pill, T } from "@/components/dash/dsl"

type AdminNav = {
  id: string
  href: string
  label: string
  icon: ReactNode
  count?: string
  tone?: "primary" | "warn"
}

const ADMIN_NAV: AdminNav[] = [
  { id: "customers", href: "/customers", label: "Customers",   icon: Ic.truck,   count: "1,240" },
  { id: "brokers",   href: "/brokers",   label: "Brokers DB",  icon: Ic.shield,  count: "318k" },
  { id: "ai",        href: "/ai-ops",    label: "AI Ops",      icon: Ic.sparkle, count: "47", tone: "primary" },
  { id: "revenue",   href: "/revenue",   label: "Revenue",     icon: Ic.dollar },
  { id: "support",   href: "/support",   label: "Support",     icon: Ic.alert,   count: "12", tone: "warn" },
]

const SYSTEM_HEALTH: Array<[string, "green" | "amber"]> = [
  ["API", "green"],
  ["Vetting models", "green"],
  ["Claim filer", "green"],
  ["DAT scraper", "amber"],
]

function activeId(pathname: string): string {
  if (pathname === "/" || pathname === "") return "customers"
  for (const n of ADMIN_NAV) {
    if (pathname.startsWith(n.href)) return n.id
  }
  return "customers"
}

function metaForPath(path: string): {
  title: string
  sub: string
  ctaIcon?: ReactNode
  ctaLabel?: string
} {
  if (path === "/" || path.startsWith("/customers"))
    return { title: "Customers", sub: "Carriers · 1,240 active", ctaIcon: Ic.plus, ctaLabel: "New customer" }
  if (path.startsWith("/brokers"))
    return { title: "Brokers · global DB", sub: "318,420 indexed", ctaIcon: Ic.plus, ctaLabel: "Add broker" }
  if (path.startsWith("/ai-ops"))
    return { title: "AI Ops", sub: "Vetting · v4.2 production · v4.3 staging", ctaIcon: Ic.sparkle, ctaLabel: "Train new" }
  if (path.startsWith("/revenue"))
    return { title: "Revenue", sub: "MRR · ARR · cohorts", ctaIcon: Ic.download, ctaLabel: "Finance export" }
  if (path.startsWith("/support"))
    return { title: "Support", sub: "12 open · 4 high priority", ctaIcon: Ic.plus, ctaLabel: "New ticket" }
  return { title: "Admin", sub: "" }
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/"
  const active = activeId(pathname)
  const meta = useMemo(() => metaForPath(pathname), [pathname])
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function logout() {
    setPending(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.replace("/login")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        background: T.bg,
        color: T.text,
        fontFamily: FF.sans,
        minHeight: "100vh",
      }}
    >
      <aside
        style={{
          width: 220,
          background: T.surfaceAlt,
          color: T.text,
          borderRight: `1px solid ${T.border}`,
          padding: "20px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px" }}>
          <svg width="22" height="22" viewBox="0 0 32 32">
            <path d="M16 3 L28 9 V20 C28 25 22 29 16 30 C10 29 4 25 4 20 V9 Z" fill={T.orange} />
            <path
              d="M11 16 L14.5 19.5 L21 12"
              stroke="#fff"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <span style={{ fontFamily: FF.display, fontSize: 17 }}>VettGuard</span>
          <Pill style={{ background: T.orange, color: "#fff", border: "none", marginLeft: 4 }}>
            Admin
          </Pill>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {ADMIN_NAV.map((n) => {
            const a = active === n.id
            return (
              <Link
                key={n.id}
                href={n.href}
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
                  fontWeight: a ? 500 : 400,
                  textDecoration: "none",
                  transition: "background 160ms ease, color 160ms ease",
                }}
              >
                <span style={{ color: a ? T.orange : T.textDim, display: "flex" }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.count && (
                  <span
                    style={{
                      fontFamily: FF.mono,
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 999,
                      background:
                        n.tone === "primary" ? T.orangeSoft : n.tone === "warn" ? T.warnSoft : T.surfaceElev,
                      color:
                        n.tone === "primary" ? T.orangeDeep : n.tone === "warn" ? T.warn : T.textDim,
                    }}
                  >
                    {n.count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        <div style={{ marginTop: 6 }}>
          <div
            style={{
              fontFamily: FF.mono,
              fontSize: 10,
              color: T.textDim,
              letterSpacing: "0.08em",
              padding: "0 10px 6px",
              textTransform: "uppercase",
            }}
          >
            System
          </div>
          <div style={{ padding: "0 4px" }}>
            {SYSTEM_HEALTH.map(([l, st]) => (
              <div
                key={l}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "5px 8px",
                  fontFamily: FF.mono,
                  fontSize: 11,
                  color: T.textDim,
                }}
              >
                <span>{l}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: st === "green" ? T.success : T.warn,
                    }}
                  />
                  <span>{st === "green" ? "OK" : "Degraded"}</span>
                </span>
              </div>
            ))}
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
          <Avatar initials="AK" color="#D9E0CC" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>Aziz K.</div>
            <div style={{ fontFamily: FF.mono, fontSize: 10, color: T.textDim }}>
              Ops · VettGuard team
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={pending}
            aria-label="Sign out"
            style={{
              background: "transparent",
              border: "none",
              color: T.textDim,
              cursor: pending ? "wait" : "pointer",
              padding: 4,
            }}
          >
            {Ic.more}
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
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
            <div
              style={{
                fontFamily: FF.display,
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: "-0.015em",
                marginTop: 2,
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
              width: 320,
              color: T.textDim,
            }}
          >
            {Ic.search}
            <span style={{ fontSize: 13 }}>Search customers, brokers, tickets…</span>
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
              color: T.textDim,
              cursor: "pointer",
            }}
          >
            {Ic.bell}
          </button>
          {meta.ctaLabel && (
            <Btn variant="primary" size="md">
              {meta.ctaIcon} {meta.ctaLabel}
            </Btn>
          )}
        </header>
        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>
    </div>
  )
}
