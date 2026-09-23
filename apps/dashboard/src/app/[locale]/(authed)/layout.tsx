// Protected dashboard layout. The (authed) route group lives at the locale
// root, so URLs stay clean: `/`, `/settings`, etc. (no /(authed) segment
// shows up).
//
// Middleware enforces auth; this layout assumes a valid session and
// renders the shell. If `currentSession()` somehow returns null here we
// hard-redirect — defense in depth.

import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { currentSession } from "@/lib/auth"
import { Sidebar } from "./_components/sidebar"
import { TopBar } from "./_components/top-bar"

export default async function AuthedLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await currentSession()
  if (!session) redirect("/sign-in")

  return (
    <div
      style={{
        display: "flex",
        background: "var(--vg-bg)",
        color: "var(--vg-text)",
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
        minHeight: "100vh",
      }}
    >
      <Sidebar role={session.role ?? ""} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar userId={session.sub ?? ""} tenantId={session.tid ?? ""} />
        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>
    </div>
  )
}
