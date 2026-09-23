"use client"

// 2FA setup wizard — three states:
//   idle    → "Enable 2FA" button. Shows current mfaOn status.
//   setup   → backend issued a new secret. Show QR + secret + recovery codes,
//             prompt for the 6-digit verify code.
//   ok      → identity flipped the factor to `verified`. Show success +
//             "Save your recovery codes" reminder.
//
// QR code is rendered client-side via `qrcode` (no third-party fetch — the
// secret never leaves the browser session).

import { useState } from "react"
import QRCode from "qrcode"

import { Btn, Card, FF, Ic, Pill, T } from "@/components/dash/dsl"

type Phase = "idle" | "loading" | "setup" | "verifying" | "ok" | "error"

export function TotpWizard({ alreadyEnabled }: { alreadyEnabled: boolean }) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [secret, setSecret] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [recovery, setRecovery] = useState<string[]>([])
  const [code, setCode] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(alreadyEnabled)

  async function start() {
    setPhase("loading")
    setErr(null)
    try {
      const res = await fetch("/api/auth/totp/enable", { method: "POST" })
      const body = (await res.json().catch(() => ({}))) as {
        secret?: string
        qrUri?: string
        recoveryCodes?: string[]
        error?: string
      }
      if (!res.ok || !body.secret || !body.qrUri) {
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const dataUrl = await QRCode.toDataURL(body.qrUri, {
        margin: 1,
        width: 220,
        color: { dark: "#0A0E14", light: "#FFFFFF" },
      })
      setSecret(body.secret)
      setQrDataUrl(dataUrl)
      setRecovery(body.recoveryCodes ?? [])
      setPhase("setup")
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Enable failed")
      setPhase("error")
    }
  }

  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPhase("verifying")
    setErr(null)
    try {
      const res = await fetch("/api/auth/totp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      setPhase("ok")
      setEnabled(true)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Verification failed")
      setPhase("setup")
    }
  }

  return (
    <Card padding={24} style={{ maxWidth: 720 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: FF.mono,
              fontSize: 10.5,
              color: T.textMute,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Two-factor authentication
          </div>
          <div
            style={{
              fontFamily: FF.display,
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              marginTop: 2,
            }}
          >
            Authenticator app
          </div>
        </div>
        <Pill tone={enabled ? "success" : "neutral"} dot>
          {enabled ? "On" : "Off"}
        </Pill>
      </div>
      <p
        style={{
          fontSize: 13,
          color: T.textDim,
          margin: "0 0 16px",
          lineHeight: 1.5,
        }}
      >
        Scan the QR with 1Password, Google Authenticator, Authy, or any TOTP
        app. We&apos;ll ask for a 6-digit code on every sign-in.
      </p>

      {phase === "idle" && (
        <Btn variant="primary" size="md" onClick={start}>
          {Ic.shield} {enabled ? "Re-enable 2FA" : "Enable 2FA"}
        </Btn>
      )}

      {phase === "loading" && (
        <div style={{ fontSize: 13, color: T.textMute }}>Issuing secret…</div>
      )}

      {phase === "error" && (
        <>
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
          <Btn variant="primary" size="md" onClick={start}>
            Try again
          </Btn>
        </>
      )}

      {(phase === "setup" || phase === "verifying") && (
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24 }}>
          <div>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                width={220}
                height={220}
                alt="TOTP QR code"
                style={{
                  display: "block",
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: "#fff",
                  padding: 6,
                }}
              />
            ) : (
              <div
                style={{
                  width: 220,
                  height: 220,
                  background: T.surfaceAlt,
                  borderRadius: 8,
                }}
              />
            )}
            <div
              style={{
                fontFamily: FF.mono,
                fontSize: 10.5,
                color: T.textMute,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginTop: 12,
                marginBottom: 4,
              }}
            >
              Or enter manually
            </div>
            <code
              style={{
                display: "block",
                fontFamily: FF.mono,
                fontSize: 12,
                padding: "6px 8px",
                background: T.surfaceAlt,
                border: `1px solid ${T.border}`,
                borderRadius: 4,
                wordBreak: "break-all",
                color: T.text,
              }}
            >
              {secret}
            </code>
          </div>

          <div>
            <form onSubmit={verify}>
              <label style={{ display: "block", marginBottom: 12 }}>
                <span
                  style={{
                    fontFamily: FF.mono,
                    fontSize: 10.5,
                    color: T.textMute,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  6-digit code from your app
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  required
                  autoFocus
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  disabled={phase === "verifying"}
                  placeholder="000000"
                  style={{
                    marginTop: 4,
                    height: 44,
                    width: 200,
                    padding: "0 12px",
                    background: T.surfaceAlt,
                    border: `1px solid ${T.borderStrong}`,
                    borderRadius: 8,
                    fontFamily: FF.mono,
                    fontSize: 22,
                    letterSpacing: "0.3em",
                    color: T.text,
                    outline: "none",
                  }}
                />
              </label>
              {err && phase === "setup" && (
                <div
                  role="alert"
                  style={{
                    fontSize: 12.5,
                    color: T.danger,
                    marginBottom: 10,
                  }}
                >
                  {err}
                </div>
              )}
              <Btn
                variant="primary"
                size="md"
                type="submit"
                disabled={phase === "verifying" || code.length !== 6}
              >
                {phase === "verifying" ? "Verifying…" : "Verify & turn on"}
              </Btn>
            </form>

            {recovery.length > 0 && (
              <div
                style={{
                  marginTop: 20,
                  padding: 14,
                  background: T.orangeTint,
                  border: `1px solid ${T.borderStrong}`,
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: FF.mono,
                    fontSize: 10,
                    color: T.orangeDeep,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {Ic.alert} Recovery codes — save these now
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: T.textDim,
                    margin: "4px 0 10px",
                    lineHeight: 1.5,
                  }}
                >
                  Use one of these if you lose your phone. Each works once.
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 6,
                  }}
                >
                  {recovery.map((c) => (
                    <code
                      key={c}
                      style={{
                        fontFamily: FF.mono,
                        fontSize: 12.5,
                        padding: "4px 8px",
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: 4,
                        color: T.text,
                      }}
                    >
                      {c}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {phase === "ok" && (
        <div
          style={{
            padding: 14,
            background: T.successSoft,
            border: `1px solid ${T.borderStrong}`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13.5,
            color: T.text,
          }}
        >
          <span style={{ color: T.success, display: "flex" }}>{Ic.check}</span>
          Two-factor authentication is on. Future sign-ins will ask for a code.
        </div>
      )}
    </Card>
  )
}
