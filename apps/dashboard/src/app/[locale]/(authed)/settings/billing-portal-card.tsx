"use client"

// Settings → Billing card. One button → fetches a Stripe Customer Portal
// session URL via /api/billing/portal and redirects the browser to it.
// Stripe handles the rest (payment methods, invoice history, plan changes,
// cancel) and sends the user back to /settings via the return_url param.

import { useState } from "react"

import { Btn, Card, FF, Ic, T } from "@/components/dash/dsl"

export function BillingPortalCard() {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function openPortal() {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      const body = (await res.json().catch(() => ({}))) as {
        url?: string
        error?: string
      }
      if (!res.ok || !body.url) {
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      window.location.href = body.url
    } catch (e) {
      setBusy(false)
      setErr(e instanceof Error ? e.message : "Portal session failed")
    }
  }

  return (
    <Card padding={24} style={{ maxWidth: 720 }}>
      <div
        style={{
          fontFamily: FF.mono,
          fontSize: 10.5,
          color: T.textMute,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Billing
      </div>
      <div
        style={{
          fontFamily: FF.display,
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: "-0.015em",
          marginTop: 2,
          marginBottom: 6,
        }}
      >
        Manage payment + invoices
      </div>
      <p
        style={{
          fontSize: 13,
          color: T.textDim,
          margin: "0 0 16px",
          lineHeight: 1.5,
          maxWidth: 560,
        }}
      >
        Update your card, download invoices, change plan, or cancel — all in
        Stripe&apos;s hosted portal. We&apos;ll send you back here when
        you&apos;re done.
      </p>

      {err && (
        <div
          role="alert"
          style={{
            padding: "10px 12px",
            background: T.dangerSoft,
            border: `1px solid ${T.borderStrong}`,
            borderRadius: 6,
            color: T.danger,
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {err}
        </div>
      )}

      <Btn variant="primary" size="md" onClick={openPortal} disabled={busy}>
        {Ic.ext} {busy ? "Opening Stripe…" : "Open billing portal"}
      </Btn>
    </Card>
  )
}
