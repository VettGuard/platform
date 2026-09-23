// VettGuard extension popup — port of docs/design/reference/project/extension.jsx ExtPopup.
// 380×600 surface that opens from the toolbar icon. When not signed in,
// shows a sign-in CTA; when signed in, shows MTD recovered, quick actions,
// and the today feed.

import { useEffect, useState } from "react"

import { Btn, FF, Ic, Mark, Pill, Spark, T } from "../components/dash/dsl"

interface SessionStatus {
  signedIn: boolean
  email: string | null
}

async function fetchStatus(): Promise<SessionStatus> {
  try {
    const { accessToken } = await chrome.storage.session.get("accessToken")
    return { signedIn: Boolean(accessToken), email: null }
  } catch {
    // Outside chrome runtime (e.g. local Vite preview) — assume signed-in
    // so the designer can iterate on the real UI.
    return { signedIn: true, email: null }
  }
}

type FeedTone = "success" | "primary" | "warn"
type FeedItem = {
  ic: React.ReactNode
  tone: FeedTone
  text: string
  when: string
}

const FEED: FeedItem[] = [
  { ic: Ic.check,   tone: "success", text: "$487.50 recovered — Atlas Freight",          when: "6 min ago" },
  { ic: Ic.sparkle, tone: "primary", text: "AI flagged BlueWave Trans. on a $3,420 load", when: "22 min ago" },
  { ic: Ic.bolt,    tone: "primary", text: "Auto-claim drafted for truck #23",            when: "1h ago" },
  { ic: Ic.shield,  tone: "success", text: "Vetted CH Robinson — score 89",               when: "2h ago" },
  { ic: Ic.alert,   tone: "warn",    text: "Coyote Logistics paying slower (38d)",        when: "5h ago" },
]

const QUICK_ACTIONS: Array<{ t: string; s: string; ic: React.ReactNode }> = [
  { t: "Vet a broker",   s: "MC# or name",      ic: Ic.shield },
  { t: "Active loads",   s: "8 in transit",     ic: Ic.truck },
  { t: "Auto-claims",    s: "3 drafted",        ic: Ic.doc },
  { t: "Carriers",       s: "1,240 sharing",    ic: Ic.user },
]

const toneBg = (tn: FeedTone) =>
  tn === "success" ? T.successSoft : tn === "primary" ? T.orangeSoft : T.warnSoft
const toneFg = (tn: FeedTone) =>
  tn === "success" ? T.success : tn === "primary" ? T.orangeDeep : T.warn

function openDashboard() {
  void chrome.tabs?.create({ url: "https://app.vettguard.com" })
}

export function Popup() {
  const [status, setStatus] = useState<SessionStatus>({ signedIn: false, email: null })

  useEffect(() => {
    void fetchStatus().then(setStatus)
  }, [])

  const handleSignIn = () => {
    void chrome.tabs?.create({ url: "https://app.vettguard.com/sign-in?from=extension" })
  }

  if (!status.signedIn) {
    return (
      <div
        style={{
          width: 380,
          background: T.surface,
          color: T.text,
          fontFamily: FF.sans,
          padding: "32px 24px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Mark size={36} withText={false} />
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: FF.display,
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            VettGuard
          </div>
          <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 4 }}>
            One-click detention recovery + broker vetting.
          </div>
        </div>
        <Btn
          variant="primary"
          size="md"
          onClick={handleSignIn}
          style={{ width: "100%", justifyContent: "center" }}
        >
          Sign in
        </Btn>
        <div
          style={{
            width: "100%",
            padding: 10,
            background: T.surfaceAlt,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            fontSize: 11.5,
            color: T.textDim,
            textAlign: "center",
          }}
        >
          Then open DAT, Truckstop, or 123Loadboard.
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        width: 380,
        height: 600,
        background: T.surface,
        color: T.text,
        fontFamily: FF.sans,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Mark size={20} withText={false} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FF.display, fontSize: 17, lineHeight: 1.1 }}>
            VettGuard
          </div>
          <div
            style={{
              fontFamily: FF.mono,
              fontSize: 10,
              color: T.textMute,
              marginTop: 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: T.success,
              }}
            />
            Connected · syncing DAT
          </div>
        </div>
        <button
          type="button"
          aria-label="Settings"
          style={{
            background: "transparent",
            border: "none",
            color: T.textMute,
            cursor: "pointer",
            padding: 4,
            display: "flex",
          }}
        >
          {Ic.cog}
        </button>
      </div>

      {/* MTD recovered banner */}
      <div
        style={{
          padding: 16,
          background: T.orangeTint,
          color: T.text,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          borderBottom: `1px solid ${T.borderStrong}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: FF.mono,
              fontSize: 10,
              color: T.orangeDeep,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Recovered · MTD
          </div>
          <Pill tone="primary">+ 18.4%</Pill>
        </div>
        <div
          style={{
            fontFamily: FF.display,
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            lineHeight: 1,
            color: T.text,
          }}
        >
          $8,420
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 11, color: T.textDim }}>
            12 claims this month · 1 awaiting
          </span>
          <Spark
            data={[4, 6, 5, 8, 12, 18, 22, 28, 34, 42, 48, 54, 68, 84]}
            w={120}
            h={28}
            color={T.orange}
          />
        </div>
      </div>

      {/* Quick actions 2×2 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        {QUICK_ACTIONS.map((a, i) => (
          <div
            key={a.t}
            style={{
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              borderRight: i % 2 === 0 ? `1px solid ${T.border}` : "none",
              borderBottom: i < 2 ? `1px solid ${T.border}` : "none",
              cursor: "pointer",
            }}
          >
            <span style={{ color: T.orange, display: "flex" }}>{a.ic}</span>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{a.t}</div>
            <div style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute }}>
              {a.s}
            </div>
          </div>
        ))}
      </div>

      {/* Today feed */}
      <div style={{ flex: 1, overflow: "auto", padding: "14px 16px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontFamily: FF.mono,
              fontSize: 10.5,
              color: T.textMute,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Today
          </div>
          <span style={{ fontSize: 11, color: T.textDim }}>5 actions</span>
        </div>
        {FEED.map((r, i) => (
          <div
            key={r.text}
            style={{
              display: "flex",
              gap: 10,
              padding: "10px 0",
              borderBottom: i < FEED.length - 1 ? `1px solid ${T.divider}` : "none",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: toneBg(r.tone),
                color: toneFg(r.tone),
              }}
            >
              {r.ic}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, lineHeight: 1.35 }}>{r.text}</div>
              <div
                style={{
                  fontFamily: FF.mono,
                  fontSize: 10,
                  color: T.textMute,
                  marginTop: 2,
                }}
              >
                {r.when}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: "12px 16px",
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          gap: 8,
        }}
      >
        <Btn
          variant="primary"
          size="sm"
          onClick={openDashboard}
          style={{ flex: 1, justifyContent: "center" }}
        >
          {Ic.ext} Open dashboard
        </Btn>
        <Btn variant="secondary" size="sm" aria-label="Settings">
          {Ic.cog}
        </Btn>
      </div>
    </div>
  )
}
