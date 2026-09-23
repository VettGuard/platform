"use client"

// Customer dashboard pages — port of docs/design/reference/project/customer.jsx.
// CustOverview / CustBrokers / CustClaims / CustSettings, plus the IntCard
// helper used by Settings.

import {
  AIBadge,
  Btn,
  Card,
  FF,
  Ic,
  LineChart,
  PageBody,
  Pill,
  ScoreRing,
  SectionHead,
  Spark,
  T,
} from "@/components/dash/dsl"

// ── Overview ─────────────────────────────────────────────────────────
export function CustOverview() {
  const kpis = [
    { eb: "Recovered · MTD", v: "$8,420", d: "+18.4%", up: true,  sub: "vs $7.1k last month", sp: [10,14,18,22,30,28,38,46,52,60,68,84] },
    { eb: "Active claims",   v: "24",     d: "+3",     up: true,  sub: "6 awaiting docs",     sp: [18,17,19,21,20,22,21,23,24,23,24,24] },
    { eb: "Brokers vetted",  v: "147",    d: "−6%",    up: false, sub: "this week",            sp: [38,42,40,46,52,48,44,50,49,45,48,47] },
    { eb: "AI auto-actions", v: "62",     d: "+24%",   up: true,  sub: "last 7 days",          sp: [12,18,22,28,34,42,52,58,62,62,60,62] },
  ]
  type FeedTone = "success" | "primary" | "warn" | "danger"
  const feed: Array<{ ic: React.ReactNode; tone: FeedTone; t: string; s: string }> = [
    { ic: Ic.check,   tone: "success", t: "$487.50 recovered from Atlas Freight",  s: "6 min · auto" },
    { ic: Ic.sparkle, tone: "primary", t: "Flagged BlueWave on a $3,420 load",     s: "22 min · AI" },
    { ic: Ic.bolt,    tone: "primary", t: "Auto-claim drafted for truck #23",      s: "1h · auto" },
    { ic: Ic.shield,  tone: "success", t: "CH Robinson scored 89",                  s: "2h · AI" },
    { ic: Ic.alert,   tone: "warn",    t: "Coyote Logistics paying slower",         s: "5h · AI" },
    { ic: Ic.check,   tone: "success", t: "$1,180 recovered from XPO",             s: "4h · auto" },
    { ic: Ic.x,       tone: "danger",  t: "BlueWave moved to blocklist",           s: "3h · policy" },
  ]
  const feedToneBg = (tn: FeedTone) =>
    tn === "success" ? T.successSoft : tn === "primary" ? T.orangeSoft : tn === "warn" ? T.warnSoft : T.dangerSoft
  const feedToneFg = (tn: FeedTone) =>
    tn === "success" ? T.success : tn === "primary" ? T.orangeDeep : tn === "warn" ? T.warn : T.danger

  const watchlist: Array<{ name: string; mc: string; score: number; reason: string; tone: "danger" | "warn" }> = [
    { name: "BlueWave Transport",   mc: "MC-721903", score: 41, reason: "Lapsed insurance + 2 bond claims",   tone: "danger" },
    { name: "Pinnacle Freight Co.", mc: "MC-441120", score: 58, reason: "Pay speed dropping (44d → 52d)",      tone: "warn" },
    { name: "Coyote Logistics",     mc: "MC-281042", score: 62, reason: "New disputes filed this week",        tone: "warn" },
    { name: "TCH Transport",        mc: "MC-998120", score: 71, reason: "Disputed last 2 detention claims",    tone: "warn" },
    { name: "Echo Global",          mc: "MC-512844", score: 67, reason: "Slowing — 22d → 29d",                 tone: "warn" },
  ]

  const actions: Array<{ ic: React.ReactNode; t: string; s: string; tone?: "primary" }> = [
    { ic: Ic.shield, t: "Vet a broker",              s: "MC# or name" },
    { ic: Ic.bolt,   t: "Review 3 drafted claims",   s: "$1,420 ready to send", tone: "primary" },
    { ic: Ic.truck,  t: "Re-sync DAT loads",         s: "Last sync 4 min ago" },
    { ic: Ic.chart,  t: "Run weekly report",         s: "Auto on Mondays" },
  ]

  return (
    <PageBody>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        {kpis.map((k) => (
          <Card key={k.eb} padding={18}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase" }}>{k.eb}</div>
              <Pill tone={k.up ? "success" : "danger"}>{k.up ? Ic.arrowUp : Ic.arrowDown} {k.d}</Pill>
            </div>
            <div style={{ fontFamily: FF.display, fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em", marginTop: 8 }}>{k.v}</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{k.sub}</div>
            <div style={{ marginTop: 10 }}><Spark data={k.sp} w={220} h={32} /></div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 18 }}>
        <Card>
          <SectionHead
            eyebrow="Recovery · 12 mo"
            title="$84,210 recovered"
            action={
              <div style={{ display: "flex", gap: 4 }}>
                {["12M", "6M", "3M", "30D"].map((p, i) => (
                  <Btn key={p} variant={i === 0 ? "secondary" : "ghost"} size="sm">{p}</Btn>
                ))}
              </div>
            }
          />
          <LineChart
            h={240}
            labels={["Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb"]}
            yFmt={(v) => "$" + (v / 1000).toFixed(0) + "k"}
            series={[
              { color: T.orange,   fill: true, data: [22,28,34,30,42,46,52,48,58,68,76,84].map((v) => v * 1000) },
              { color: T.textMute, dashed: true, data: [28,34,42,40,52,58,64,60,72,82,90,98].map((v) => v * 1000) },
            ]}
          />
        </Card>

        <Card padding={0}>
          <div style={{ padding: "18px 20px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 6 }}>
            <AIBadge />
            <span style={{ fontFamily: FF.display, fontSize: 17, fontWeight: 600 }}>AI feed</span>
          </div>
          {feed.map((r, i) => (
            <div key={r.t} style={{ display: "flex", gap: 10, padding: "12px 20px", borderBottom: i < feed.length - 1 ? `1px solid ${T.divider}` : "none" }}>
              <div
                style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: feedToneBg(r.tone), color: feedToneFg(r.tone),
                }}
              >{r.ic}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>{r.t}</div>
                <div style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, marginTop: 2 }}>{r.s}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>
        <Card padding={0}>
          <div style={{ padding: "18px 20px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase" }}>Watchlist · AI surfaced</div>
              <div style={{ fontFamily: FF.display, fontSize: 18, fontWeight: 600, marginTop: 2 }}>Brokers to avoid this week</div>
            </div>
            <Btn variant="ghost" size="sm">View all {Ic.chevR}</Btn>
          </div>
          {watchlist.map((r, i) => (
            <div key={r.mc} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < watchlist.length - 1 ? `1px solid ${T.divider}` : "none" }}>
              <ScoreRing score={r.score} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontFamily: FF.mono, fontSize: 11, color: T.textMute }}>{r.mc} · {r.reason}</div>
              </div>
              <Pill tone={r.tone} dot>{r.score < 50 ? "Block" : "Watch"}</Pill>
            </div>
          ))}
        </Card>

        <Card>
          <SectionHead eyebrow="Quick actions" title="Right now" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {actions.map((a) => (
              <button
                key={a.t}
                style={{
                  display: "flex", gap: 12, alignItems: "center",
                  padding: 12, borderRadius: 4,
                  background: a.tone === "primary" ? T.orangeTint : "transparent",
                  border: `1px solid ${a.tone === "primary" ? T.borderStrong : T.border}`,
                  color: T.text, textAlign: "left", cursor: "pointer", fontFamily: FF.sans,
                }}
              >
                <span style={{ width: 30, height: 30, borderRadius: 4, background: a.tone === "primary" ? T.orange : T.surfaceElev, color: a.tone === "primary" ? "#fff" : T.text, display: "flex", alignItems: "center", justifyContent: "center" }}>{a.ic}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 500 }}>{a.t}</span>
                  <span style={{ display: "block", fontFamily: FF.mono, fontSize: 10.5, color: T.textMute }}>{a.s}</span>
                </span>
                <span style={{ color: T.textMute }}>{Ic.chevR}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </PageBody>
  )
}

// ── Brokers ──────────────────────────────────────────────────────────
// Real data path: list/vet via /api/brokers (proxy to gateway → brokers
// service). Status enum maps to a colour pill tone; recoveredCents → $.

import { useEffect, useState } from "react"

import { listBrokers, vetBroker, type Broker } from "@/lib/brokers"

type StatusFilter = "all" | "preferred" | "active" | "watch" | "blocked"

function toneFor(status: Broker["status"]): "success" | "warn" | "danger" {
  if (status === "blocked") return "danger"
  if (status === "watch") return "warn"
  return "success"
}

function statusLabel(status: Broker["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function CustBrokers() {
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [vetOpen, setVetOpen] = useState(false)

  async function refresh() {
    setLoading(true)
    setLoadError(null)
    try {
      const out = await listBrokers()
      setBrokers(out)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load brokers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const filtered = filter === "all" ? brokers : brokers.filter((b) => b.status === filter)
  const counts = brokers.reduce<Record<string, number>>(
    (acc, b) => {
      acc[b.status] = (acc[b.status] ?? 0) + 1
      return acc
    },
    {},
  )
  const tabs: Array<[StatusFilter, string, number]> = [
    ["all",       "All",        brokers.length],
    ["preferred", "Preferred",  counts.preferred ?? 0],
    ["active",    "Active",     counts.active ?? 0],
    ["watch",     "Watch",      counts.watch ?? 0],
    ["blocked",   "Blocked",    counts.blocked ?? 0],
  ]
  return (
    <PageBody>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {tabs.map(([k, label, n]) => {
          const active = filter === k
          return (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              style={{
                display: "inline-flex", gap: 8, alignItems: "center", padding: "7px 12px",
                background: active ? T.surface : "transparent",
                border: `1px solid ${active ? T.borderStrong : T.border}`,
                borderRadius: 4, color: active ? T.text : T.textDim,
                fontFamily: FF.sans, fontSize: 13, cursor: "pointer",
              }}
            >
              {label}<span style={{ fontFamily: FF.mono, color: T.textMute }}>{n}</span>
            </button>
          )
        })}
        <div style={{ width: 1, alignSelf: "stretch", background: T.border, margin: "0 4px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, color: T.textDim }}>
          {Ic.search}<span style={{ fontSize: 13 }}>Search 318k brokers by MC#, DOT, or name…</span>
          <AIBadge>AI search</AIBadge>
        </div>
        <Btn variant="secondary" size="md">{Ic.download} Export</Btn>
        <Btn variant="primary" size="md" onClick={() => setVetOpen(true)}>
          {Ic.plus} Vet new
        </Btn>
      </div>

      {loadError && (
        <Card padding={20} style={{ marginBottom: 14, background: T.dangerSoft, border: `1px solid ${T.borderStrong}` }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ color: T.danger, display: "flex" }}>{Ic.alert}</span>
            <div style={{ flex: 1, fontSize: 13, color: T.text }}>{loadError}</div>
            <Btn variant="secondary" size="sm" onClick={() => void refresh()}>Retry</Btn>
          </div>
        </Card>
      )}

      <Card padding={0}>
        <div
          style={{
            display: "grid", gridTemplateColumns: "60px 1.6fr 100px 90px 90px 130px 110px 36px",
            padding: "10px 18px", gap: 12, borderBottom: `1px solid ${T.border}`,
            fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase",
          }}
        >
          <div>AI</div><div>Broker</div><div>Status</div><div>Pay</div><div>Loads</div>
          <div style={{ textAlign: "right" }}>Recovered</div><div>Trend</div><div />
        </div>

        {loading && brokers.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center", fontSize: 13, color: T.textMute }}>
            Loading brokers…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: FF.display, fontSize: 18, fontWeight: 600, color: T.text }}>
              {brokers.length === 0 ? "No brokers vetted yet." : `No ${filter} brokers.`}
            </div>
            <div style={{ fontSize: 13, color: T.textDim, marginTop: 6 }}>
              {brokers.length === 0
                ? "Click \"Vet new\" to score your first broker by MC number."
                : "Switch tabs or vet a new broker to populate this view."}
            </div>
            <div style={{ marginTop: 16 }}>
              <Btn variant="primary" size="md" onClick={() => setVetOpen(true)}>
                {Ic.plus} Vet a broker
              </Btn>
            </div>
          </div>
        ) : (
          filtered.map((b, i) => {
            const tone = toneFor(b.status)
            return (
              <div
                key={b.id}
                style={{
                  display: "grid", gridTemplateColumns: "60px 1.6fr 100px 90px 90px 130px 110px 36px",
                  padding: "12px 18px", gap: 12, alignItems: "center",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${T.divider}` : "none",
                  fontFamily: FF.sans,
                }}
              >
                <ScoreRing score={b.score} size={36} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{b.name}</div>
                  <div style={{ fontFamily: FF.mono, fontSize: 11, color: T.textMute }}>
                    {b.mc}{b.city ? ` · ${b.city}` : ""}
                  </div>
                </div>
                <Pill tone={tone} dot>{statusLabel(b.status)}</Pill>
                <span style={{ fontFamily: FF.mono, fontSize: 12.5, color: b.payDays > 30 ? T.danger : T.text }}>
                  {b.payDays}d
                </span>
                <span style={{ fontFamily: FF.mono, fontSize: 12.5 }}>{b.loads}</span>
                <span style={{ fontFamily: FF.mono, fontSize: 12.5, color: T.orange, textAlign: "right" }}>
                  ${(b.recoveredCents / 100).toLocaleString()}
                </span>
                <Spark
                  data={[b.score-5,b.score-3,b.score-2,b.score,b.score+1,b.score-1,b.score,b.score-2,b.score,b.score+1,b.score,b.score]}
                  w={80} h={20}
                  color={tone === "danger" ? T.danger : tone === "warn" ? T.warn : T.success}
                  stroke={1.2}
                />
                <span style={{ color: T.textMute, display: "flex", justifyContent: "flex-end" }}>{Ic.more}</span>
              </div>
            )
          })
        )}

        {brokers.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", fontFamily: FF.mono, fontSize: 11, color: T.textMute }}>
            <span>Showing {filtered.length} of {brokers.length} · Sorted by Score ↓</span>
            <span>{loading ? "Refreshing…" : `Last sync ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}</span>
          </div>
        )}
      </Card>

      {vetOpen && (
        <VetBrokerModal
          onClose={() => setVetOpen(false)}
          onVetted={() => {
            setVetOpen(false)
            void refresh()
          }}
        />
      )}
    </PageBody>
  )
}

function VetBrokerModal({ onClose, onVetted }: { onClose: () => void; onVetted: () => void }) {
  const [mc, setMc] = useState("")
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await vetBroker({ mc, name: name || undefined, city: city || undefined })
      onVetted()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vet failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vet a broker"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(10,14,20,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, padding: 20,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{
          width: 420, maxWidth: "100%", background: T.surface, color: T.text,
          borderRadius: 12, border: `1px solid ${T.border}`,
          boxShadow: "0 24px 64px rgba(10,14,20,0.20)",
          fontFamily: FF.sans, padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: FF.display, fontSize: 20, fontWeight: 600, letterSpacing: "-0.015em" }}>
            Vet a broker
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "transparent", border: "none", color: T.textMute, cursor: "pointer", padding: 4, display: "flex" }}
          >
            {Ic.x}
          </button>
        </div>
        <p style={{ fontSize: 13, color: T.textDim, margin: "0 0 18px", lineHeight: 1.45 }}>
          Enter the broker&apos;s MC number. We&apos;ll score them against the network
          and surface a risk verdict.
        </p>

        <label style={{ display: "block", marginBottom: 10 }}>
          <span style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            MC number
          </span>
          <input
            type="text"
            required
            autoFocus
            value={mc}
            onChange={(e) => setMc(e.target.value)}
            disabled={busy}
            placeholder="MC-839201"
            style={{
              marginTop: 4, height: 38, width: "100%", padding: "0 12px",
              background: T.surfaceAlt, border: `1px solid ${T.borderStrong}`, borderRadius: 6,
              fontFamily: FF.mono, fontSize: 14, color: T.text, outline: "none",
            }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 10 }}>
          <span style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Broker name <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            placeholder="Atlas Freight Brokers"
            style={{
              marginTop: 4, height: 38, width: "100%", padding: "0 12px",
              background: T.surfaceAlt, border: `1px solid ${T.borderStrong}`, borderRadius: 6,
              fontFamily: FF.sans, fontSize: 14, color: T.text, outline: "none",
            }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 18 }}>
          <span style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            City <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </span>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={busy}
            placeholder="Chicago, IL"
            style={{
              marginTop: 4, height: 38, width: "100%", padding: "0 12px",
              background: T.surfaceAlt, border: `1px solid ${T.borderStrong}`, borderRadius: 6,
              fontFamily: FF.sans, fontSize: 14, color: T.text, outline: "none",
            }}
          />
        </label>

        {error && (
          <div role="alert" style={{ fontSize: 12.5, color: T.danger, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn variant="ghost" size="md" onClick={onClose} type="button">
            Cancel
          </Btn>
          <Btn variant="primary" size="md" type="submit" disabled={busy}>
            {busy ? "Scoring…" : "Vet broker"}
          </Btn>
        </div>
      </form>
    </div>
  )
}

// ── Claims ───────────────────────────────────────────────────────────
type PillTone = "info" | "success" | "warn" | "danger" | "neutral" | "primary"

import {
  createClaim,
  draftClaim,
  listClaims,
  markClaimPaid,
  sendClaim,
  type Claim,
  type ClaimStatus,
} from "@/lib/claims"

function claimToneFor(status: ClaimStatus): PillTone {
  switch (status) {
    case "paid":     return "success"
    case "sent":     return "info"
    case "draft":    return "warn"
    case "disputed": return "danger"
    case "denied":   return "danger"
  }
}
function claimLabel(status: ClaimStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
function fmtCents(c: number): string {
  return `$${(c / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}
function relTime(iso: string): string {
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  const min = Math.round(diff / 60_000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  return `${day}d ago`
}

type ClaimFilter = "all" | ClaimStatus

export function CustClaims() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ClaimFilter>("all")
  const [newOpen, setNewOpen] = useState(false)
  const [drawerClaim, setDrawerClaim] = useState<Claim | null>(null)

  async function refresh() {
    setLoading(true)
    setLoadError(null)
    try {
      setClaims(await listClaims())
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load claims")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void refresh()
  }, [])

  const filtered = filter === "all" ? claims : claims.filter((c) => c.status === filter)
  const counts = claims.reduce<Record<string, number>>((a, c) => {
    a[c.status] = (a[c.status] ?? 0) + 1
    return a
  }, {})

  const drafts = claims.filter((c) => c.status === "draft")
  const draftSum = drafts.reduce((acc, c) => acc + c.claimAmountCents, 0)
  const recoveredMTD = claims
    .filter((c) => c.status === "paid" && new Date(c.paidAt ?? c.createdAt).getMonth() === new Date().getMonth())
    .reduce((acc, c) => acc + c.recoveredCents, 0)
  const openCount = claims.filter((c) => c.status !== "paid" && c.status !== "denied").length
  const disputedCount = counts.disputed ?? 0

  const stats: Array<{ lbl: string; v: string; s: string; tone: PillTone }> = [
    { lbl: "Open · all stages",  v: String(openCount), s: `${drafts.length} drafts · ${(counts.sent ?? 0)} sent`, tone: "info" },
    { lbl: "Recovered · MTD",    v: fmtCents(recoveredMTD), s: `${counts.paid ?? 0} paid · ${claims.length} lifetime`, tone: "success" },
    { lbl: "In dispute",         v: String(disputedCount), s: disputedCount === 0 ? "Nothing escalated" : "Ops team owns these", tone: "warn" },
    { lbl: "Drafts awaiting",    v: String(drafts.length), s: drafts.length === 0 ? "All caught up" : "1-tap approval", tone: "primary" },
  ]
  const tabs: Array<[ClaimFilter, string, number]> = [
    ["all",      "All",      claims.length],
    ["draft",    "Draft",    counts.draft ?? 0],
    ["sent",     "Sent",     counts.sent ?? 0],
    ["paid",     "Paid",     counts.paid ?? 0],
    ["disputed", "Disputed", counts.disputed ?? 0],
    ["denied",   "Denied",   counts.denied ?? 0],
  ]

  return (
    <PageBody>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        {stats.map((s) => (
          <Card key={s.lbl} padding={18}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.lbl}</div>
              <Pill tone={s.tone} dot> </Pill>
            </div>
            <div style={{ fontFamily: FF.display, fontSize: 28, fontWeight: 500, marginTop: 6, letterSpacing: "-0.02em" }}>{s.v}</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{s.s}</div>
          </Card>
        ))}
      </div>

      {drafts.length > 0 && (
        <Card
          padding={20}
          style={{
            background: T.orangeTint, color: T.text,
            border: `1px solid ${T.borderStrong}`, marginBottom: 16,
            display: "flex", alignItems: "center", gap: 16,
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: T.orange, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{Ic.sparkle}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AIBadge>AI drafted</AIBadge>
              <span style={{ fontFamily: FF.mono, fontSize: 11, color: T.textDim }}>
                {drafts.length} {drafts.length === 1 ? "claim" : "claims"} awaiting your 1-tap approval
              </span>
            </div>
            <div style={{ fontFamily: FF.display, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 4, color: T.text }}>
              {fmtCents(draftSum)} ready to send
            </div>
          </div>
          <Btn variant="accent" size="md" onClick={() => setDrawerClaim(drafts[0]!)}>
            Review &amp; approve
          </Btn>
        </Card>
      )}

      {loadError && (
        <Card padding={16} style={{ marginBottom: 14, background: T.dangerSoft, border: `1px solid ${T.borderStrong}` }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ color: T.danger, display: "flex" }}>{Ic.alert}</span>
            <div style={{ flex: 1, fontSize: 13, color: T.text }}>{loadError}</div>
            <Btn variant="secondary" size="sm" onClick={() => void refresh()}>Retry</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
        {tabs.map(([k, label, n]) => {
          const a = filter === k
          return (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              style={{
                display: "inline-flex", gap: 8, padding: "7px 12px",
                background: a ? T.surface : "transparent",
                border: `1px solid ${a ? T.borderStrong : T.border}`,
                borderRadius: 4, color: a ? T.text : T.textDim,
                fontSize: 13, cursor: "pointer", fontFamily: FF.sans,
              }}
            >
              {label} <span style={{ fontFamily: FF.mono, color: T.textMute }}>{n}</span>
            </button>
          )
        })}
        <div style={{ flex: 1 }} />
        <Btn variant="primary" size="md" onClick={() => setNewOpen(true)}>{Ic.plus} New claim</Btn>
      </div>

      <Card padding={0}>
        <div
          style={{
            display: "grid", gridTemplateColumns: "110px 1.4fr 1fr 60px 90px 100px 130px 90px",
            padding: "10px 18px", gap: 12, borderBottom: `1px solid ${T.border}`,
            fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase",
          }}
        >
          <div>Claim</div><div>Broker</div><div>Load</div><div>Hrs</div>
          <div style={{ textAlign: "right" }}>Claim</div>
          <div style={{ textAlign: "right" }}>Recovered</div>
          <div>Status</div><div style={{ textAlign: "right" }}>Filed</div>
        </div>

        {loading && claims.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center", fontSize: 13, color: T.textMute }}>
            Loading claims…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: FF.display, fontSize: 18, fontWeight: 600, color: T.text }}>
              {claims.length === 0 ? "No detention claims yet." : `No ${filter} claims.`}
            </div>
            <div style={{ fontSize: 13, color: T.textDim, marginTop: 6 }}>
              {claims.length === 0
                ? "Create your first claim when a load runs detention — AI drafts the broker email."
                : "Switch tabs or create one."}
            </div>
            <div style={{ marginTop: 16 }}>
              <Btn variant="primary" size="md" onClick={() => setNewOpen(true)}>
                {Ic.plus} New claim
              </Btn>
            </div>
          </div>
        ) : (
          filtered.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setDrawerClaim(c)}
              style={{
                display: "grid", gridTemplateColumns: "110px 1.4fr 1fr 60px 90px 100px 130px 90px",
                padding: "12px 18px", gap: 12, alignItems: "center", width: "100%",
                borderBottom: i < filtered.length - 1 ? `1px solid ${T.divider}` : "none",
                fontSize: 13, background: "transparent", border: "none",
                textAlign: "left", cursor: "pointer", fontFamily: FF.sans,
                color: T.text,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FF.mono, color: T.orange, fontWeight: 500 }}>
                {c.aiDrafted && <span style={{ display: "flex", color: T.orangeDeep }}>{Ic.sparkle}</span>}
                {c.ref}
              </span>
              <span>{c.brokerName || c.brokerMc}</span>
              <span style={{ fontFamily: FF.mono, color: T.textDim }}>{c.loadRef || "—"}</span>
              <span style={{ fontFamily: FF.mono }}>{c.dwellHours}h</span>
              <span style={{ fontFamily: FF.mono, textAlign: "right" }}>{fmtCents(c.claimAmountCents)}</span>
              <span style={{ fontFamily: FF.mono, color: c.recoveredCents > 0 ? T.success : T.textMute, textAlign: "right" }}>
                {c.recoveredCents > 0 ? fmtCents(c.recoveredCents) : "—"}
              </span>
              <Pill tone={claimToneFor(c.status)} dot>{claimLabel(c.status)}</Pill>
              <span style={{ fontFamily: FF.mono, fontSize: 11, color: T.textMute, textAlign: "right" }}>{relTime(c.createdAt)}</span>
            </button>
          ))
        )}
      </Card>

      {newOpen && (
        <NewClaimModal
          onClose={() => setNewOpen(false)}
          onCreated={(c) => {
            setNewOpen(false)
            void refresh()
            setDrawerClaim(c)
          }}
        />
      )}

      {drawerClaim && (
        <ClaimDrawer
          claim={drawerClaim}
          onClose={() => setDrawerClaim(null)}
          onUpdated={(c) => {
            setDrawerClaim(c)
            void refresh()
          }}
        />
      )}
    </PageBody>
  )
}

function NewClaimModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (c: Claim) => void
}) {
  const [brokerMc, setBrokerMc] = useState("")
  const [brokerName, setBrokerName] = useState("")
  const [loadRef, setLoadRef] = useState("")
  const [dwellHours, setDwellHours] = useState("3.0")
  const [amount, setAmount] = useState("225")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const c = await createClaim({
        brokerMc,
        brokerName: brokerName || undefined,
        loadRef: loadRef || undefined,
        dwellHours: Number(dwellHours),
        claimAmountCents: Math.round(Number(amount) * 100),
      })
      onCreated(c)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New detention claim"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(10,14,20,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, padding: 20,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{
          width: 460, maxWidth: "100%", background: T.surface, color: T.text,
          borderRadius: 12, border: `1px solid ${T.border}`,
          boxShadow: "0 24px 64px rgba(10,14,20,0.20)",
          fontFamily: FF.sans, padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: FF.display, fontSize: 20, fontWeight: 600, letterSpacing: "-0.015em" }}>
            New detention claim
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "transparent", border: "none", color: T.textMute, cursor: "pointer", padding: 4, display: "flex" }}
          >
            {Ic.x}
          </button>
        </div>
        <p style={{ fontSize: 13, color: T.textDim, margin: "0 0 18px", lineHeight: 1.45 }}>
          Fill the basics, then hit Create. AI drafts the broker email next.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <ClaimField label="Broker MC" value={brokerMc} onChange={setBrokerMc} placeholder="MC-839201" mono required autoFocus disabled={busy} />
          <ClaimField label="Load ref" value={loadRef} onChange={setLoadRef} placeholder="L-9921" mono disabled={busy} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <ClaimField label="Broker name (optional)" value={brokerName} onChange={setBrokerName} placeholder="Atlas Freight Brokers" disabled={busy} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          <ClaimField label="Dwell hours" value={dwellHours} onChange={setDwellHours} placeholder="3.0" mono type="number" step="0.1" min="0" max="168" required disabled={busy} />
          <ClaimField label="Amount ($)" value={amount} onChange={setAmount} placeholder="225" mono type="number" step="1" min="0" required disabled={busy} />
        </div>

        {error && (
          <div role="alert" style={{ fontSize: 12.5, color: T.danger, marginBottom: 12 }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn variant="ghost" size="md" onClick={onClose} type="button">Cancel</Btn>
          <Btn variant="primary" size="md" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create draft"}
          </Btn>
        </div>
      </form>
    </div>
  )
}

function ClaimField({
  label, value, onChange, placeholder, mono, type = "text", required, autoFocus, disabled, step, min, max,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  type?: "text" | "number"
  required?: boolean
  autoFocus?: boolean
  disabled?: boolean
  step?: string
  min?: string
  max?: string
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        disabled={disabled}
        step={step}
        min={min}
        max={max}
        style={{
          marginTop: 4, height: 38, width: "100%", padding: "0 12px",
          background: T.surfaceAlt, border: `1px solid ${T.borderStrong}`, borderRadius: 6,
          fontFamily: mono ? FF.mono : FF.sans, fontSize: 14, color: T.text, outline: "none",
        }}
      />
    </label>
  )
}

function ClaimDrawer({
  claim, onClose, onUpdated,
}: {
  claim: Claim
  onClose: () => void
  onUpdated: (c: Claim) => void
}) {
  const [busy, setBusy] = useState<"draft" | "send" | "paid" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recoveredInput, setRecoveredInput] = useState(((claim.claimAmountCents) / 100).toFixed(2))

  async function runDraft() {
    setBusy("draft"); setError(null)
    try { onUpdated(await draftClaim(claim.id)) }
    catch (e) { setError(e instanceof Error ? e.message : "Draft failed") }
    finally { setBusy(null) }
  }
  async function runSend() {
    setBusy("send"); setError(null)
    try {
      const c = await sendClaim(claim.id)
      onUpdated(c)
      const mailto = buildMailto(c)
      if (mailto) window.location.href = mailto
    } catch (e) { setError(e instanceof Error ? e.message : "Send failed") }
    finally { setBusy(null) }
  }
  async function runPaid() {
    setBusy("paid"); setError(null)
    try {
      const cents = Math.round(Number(recoveredInput) * 100)
      onUpdated(await markClaimPaid(claim.id, cents))
    } catch (e) { setError(e instanceof Error ? e.message : "Mark-paid failed") }
    finally { setBusy(null) }
  }

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Claim ${claim.ref}`}
      style={{
        position: "fixed", inset: 0, background: "rgba(10,14,20,0.45)",
        display: "flex", justifyContent: "flex-end", zIndex: 50,
      }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560, maxWidth: "100%", background: T.surface, color: T.text,
          height: "100%", overflowY: "auto", fontFamily: FF.sans,
          boxShadow: "-24px 0 64px rgba(10,14,20,0.20)",
        }}
      >
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: FF.mono, fontSize: 11, color: T.orange, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              {claim.aiDrafted && <span style={{ color: T.orangeDeep, display: "flex" }}>{Ic.sparkle}</span>}
              {claim.ref}
            </div>
            <div style={{ fontFamily: FF.display, fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", marginTop: 2 }}>
              {claim.brokerName || claim.brokerMc}
            </div>
            <div style={{ fontFamily: FF.mono, fontSize: 11.5, color: T.textMute, marginTop: 2 }}>
              {claim.brokerMc} · Load {claim.loadRef || "—"} · {claim.dwellHours}h dwell
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            style={{ background: "transparent", border: "none", color: T.textMute, cursor: "pointer", padding: 6, display: "flex" }}>
            {Ic.x}
          </button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <KV label="Claim" value={fmtCents(claim.claimAmountCents)} />
            <KV label="Recovered" value={claim.recoveredCents > 0 ? fmtCents(claim.recoveredCents) : "—"} accent={claim.recoveredCents > 0} />
            <KV label="Status" value={claimLabel(claim.status)} />
          </div>

          {claim.status === "paid" && (
            <div
              style={{
                padding: "12px 14px",
                background: T.successSoft,
                border: `1px solid ${T.borderStrong}`,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: T.success, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {Ic.dollar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FF.mono, fontSize: 10, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
                  18% success fee · {fmtCents(Math.round(claim.recoveredCents * 0.18))}
                </div>
                <div style={{ fontSize: 12.5, color: T.text, marginTop: 2 }}>
                  {claim.successFeeInvoiceId
                    ? `Invoice ${claim.successFeeInvoiceId} created`
                    : "Invoice will appear once billing replies — refresh in a moment"}
                </div>
              </div>
              {claim.successFeeUrl && (
                <Btn
                  variant="secondary"
                  size="sm"
                  href={claim.successFeeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open invoice {Ic.ext}
                </Btn>
              )}
            </div>
          )}

          {claim.status === "draft" && !claim.draftedBody && (
            <div style={{ padding: 14, background: T.orangeTint, border: `1px solid ${T.borderStrong}`, borderRadius: 8 }}>
              <div style={{ fontFamily: FF.mono, fontSize: 10, color: T.orangeDeep, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                {Ic.sparkle} AI ready
              </div>
              <div style={{ fontSize: 13, color: T.textDim, marginTop: 4, lineHeight: 1.5 }}>
                Generate a broker email from this claim. You can edit before sending.
              </div>
              <Btn variant="primary" size="md" onClick={runDraft} disabled={busy === "draft"} style={{ marginTop: 10 }}>
                {Ic.sparkle} {busy === "draft" ? "Drafting…" : "Draft with AI"}
              </Btn>
            </div>
          )}

          {claim.draftedBody && (
            <div>
              <div style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                Subject
              </div>
              <div style={{ padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13.5, fontWeight: 500 }}>
                {claim.draftedSubject}
              </div>
              <div style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.06em", textTransform: "uppercase", margin: "14px 0 6px" }}>
                Body {claim.aiDrafted && <span style={{ color: T.orangeDeep, fontWeight: 600, marginLeft: 6 }}>· AI-drafted</span>}
              </div>
              <pre
                style={{
                  padding: "12px 14px", background: T.surfaceAlt, border: `1px solid ${T.border}`,
                  borderRadius: 6, fontSize: 13, lineHeight: 1.55, color: T.text,
                  whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0,
                  fontFamily: FF.sans, maxHeight: 320, overflow: "auto",
                }}
              >{claim.draftedBody}</pre>
              {claim.status === "draft" && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Btn variant="primary" size="md" onClick={runSend} disabled={busy === "send"}>
                    {busy === "send" ? "Opening mail…" : "Open email + mark sent"}
                  </Btn>
                  <Btn variant="ghost" size="md" onClick={runDraft} disabled={busy === "draft"}>
                    Re-draft
                  </Btn>
                </div>
              )}
            </div>
          )}

          {claim.status === "sent" && (
            <div style={{ padding: 14, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <div style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                Mark as paid
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <label style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 11.5, color: T.textDim, marginBottom: 4 }}>Recovered amount ($)</span>
                  <input
                    type="number"
                    value={recoveredInput}
                    onChange={(e) => setRecoveredInput(e.target.value)}
                    step="0.01" min="0"
                    style={{
                      height: 38, width: "100%", padding: "0 12px",
                      background: T.surface, border: `1px solid ${T.borderStrong}`, borderRadius: 6,
                      fontFamily: FF.mono, fontSize: 14, color: T.text, outline: "none",
                    }}
                  />
                </label>
                <Btn variant="primary" size="md" onClick={runPaid} disabled={busy === "paid"}>
                  {busy === "paid" ? "Saving…" : "Mark paid"}
                </Btn>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" style={{ fontSize: 12.5, color: T.danger }}>{error}</div>
          )}
        </div>
      </aside>
    </div>
  )
}

function KV({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ fontFamily: FF.mono, fontSize: 10, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: FF.display, fontSize: 18, fontWeight: 600, color: accent ? T.success : T.text, marginTop: 2, letterSpacing: "-0.01em" }}>{value}</div>
    </div>
  )
}

function buildMailto(c: Claim): string | null {
  // The dispatcher's flow: we don't have the broker's email on file
  // (FMCSA scrape is Phase 3), so open a blank mail composer with the
  // AI-drafted subject + body pre-filled. The dispatcher pastes the
  // address and attaches BOL/ELD evidence.
  const params = new URLSearchParams({
    subject: c.draftedSubject,
    body: c.draftedBody,
  })
  return `mailto:?${params.toString()}`
}

// ── Settings ─────────────────────────────────────────────────────────
type IntStatus = "Active" | "Connected" | "Available"
type IntTone = "success" | "neutral"
type Integration = { n: string; sub: string; status: IntStatus; tone: IntTone; glyph: string; color: string }

function IntCard({ n, sub, status, tone, glyph, color }: Integration) {
  return (
    <div
      style={{
        padding: 16,
        border: `1px solid ${T.border}`,
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        background: T.surface,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 4, background: color,
            color: status === "Available" ? T.text : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: FF.display, fontSize: 17, fontWeight: 600,
          }}
        >
          {glyph}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{n}</div>
          <div style={{ fontSize: 11.5, color: T.textDim, marginTop: 2 }}>{sub}</div>
        </div>
        <Pill tone={tone} dot={status === "Connected" || status === "Active"}>{status}</Pill>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {tone === "success" ? (
          <>
            <Btn variant="secondary" size="sm">Configure</Btn>
            <Btn variant="ghost" size="sm">Disconnect</Btn>
          </>
        ) : (
          <Btn variant="primary" size="sm">Connect</Btn>
        )}
      </div>
    </div>
  )
}

export function CustSettings() {
  const settingsTabs: Array<[string, boolean]> = [
    ["Account", false],
    ["Integrations", true],
    ["AI preferences", false],
    ["Team", false],
    ["Billing", false],
    ["Notifications", false],
    ["Security", false],
  ]
  const loadBoards: Integration[] = [
    { n: "DAT One",      sub: "Detected · 247 loads scanned today", status: "Active",    tone: "success", glyph: "D", color: "#2A4A6E" },
    { n: "Truckstop",    sub: "Detected · 184 loads scanned today", status: "Active",    tone: "success", glyph: "T", color: "#5A2E0F" },
    { n: "123Loadboard", sub: "Connect to vet brokers here too",     status: "Available", tone: "neutral", glyph: "1", color: T.surfaceElev },
    { n: "NextLoad",     sub: "Connect to vet brokers here too",     status: "Available", tone: "neutral", glyph: "N", color: T.surfaceElev },
  ]
  const eld: Integration[] = [
    { n: "Geotab",        sub: "42 trucks streaming · used in 184 claims", status: "Connected", tone: "success", glyph: "G", color: "#152F66" },
    { n: "Samsara",       sub: "38 trucks streaming · used in 122 claims", status: "Connected", tone: "success", glyph: "S", color: "#1F6FE5" },
    { n: "Motive",        sub: "Connect to use HOS + geofence",            status: "Available", tone: "neutral", glyph: "M", color: T.surfaceElev },
    { n: "Omnitracs One", sub: "For legacy fleets",                         status: "Available", tone: "neutral", glyph: "O", color: T.surfaceElev },
  ]
  const factoring: Integration[] = [
    { n: "TBS Factoring",      sub: "Recovered detention deposits to ****-2841", status: "Connected", tone: "success", glyph: "T", color: "#0E4F3D" },
    { n: "Triumph Financial",  sub: "Connect to route recoveries here",          status: "Available", tone: "neutral", glyph: "T", color: T.surfaceElev },
    { n: "Direct ACH · Plaid", sub: "Chase ****-9020 · 1–2 business days",       status: "Connected", tone: "success", glyph: "A", color: "#1B5C7A" },
    { n: "OTR Capital",        sub: "For OTR-factored carriers",                 status: "Available", tone: "neutral", glyph: "O", color: T.surfaceElev },
  ]

  return (
    <PageBody>
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 32 }}>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {settingsTabs.map(([l, a]) => (
            <div
              key={l}
              style={{
                display: "flex", alignItems: "center", padding: "8px 12px", borderRadius: 4,
                background: a ? T.orangeTint : "transparent",
                color: a ? T.text : T.textDim,
                borderLeft: `2px solid ${a ? T.orange : "transparent"}`,
                fontSize: 13, cursor: "pointer", fontWeight: a ? 500 : 400,
              }}
            >
              {l}
            </div>
          ))}
        </nav>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase" }}>Integrations</div>
              <div style={{ fontFamily: FF.display, fontSize: 22, marginTop: 2, letterSpacing: "-0.01em", fontWeight: 500 }}>Where VettGuard connects</div>
              <div style={{ fontSize: 13, color: T.textDim, marginTop: 4 }}>
                The extension does most of the work on its own. Connect your ELD + factoring to enable auto-claims.
              </div>
            </div>
            <Btn variant="secondary" size="md">Browse all 40+ {Ic.ext}</Btn>
          </div>

          <SectionHead eyebrow="Load boards · where the extension lives" title="" style={{ marginBottom: 10 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 22 }}>
            {loadBoards.map((it) => <IntCard key={it.n} {...it} />)}
          </div>

          <SectionHead eyebrow="ELD & telematics · evidence" title="" style={{ marginBottom: 10 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 22 }}>
            {eld.map((it) => <IntCard key={it.n} {...it} />)}
          </div>

          <SectionHead eyebrow="Factoring & banks · recovered $ go here" title="" style={{ marginBottom: 10 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {factoring.map((it) => <IntCard key={it.n} {...it} />)}
          </div>
        </div>
      </div>
    </PageBody>
  )
}
