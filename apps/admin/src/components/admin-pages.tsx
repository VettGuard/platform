"use client"

// Internal admin pages — port of docs/design/reference/project/admin.jsx.
// AdminCustomers / AdminBrokers / AdminAIOps / AdminRevenue / AdminSupport.

import {
  AIBadge,
  Avatar,
  Bars,
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

type PillTone = "success" | "warn" | "danger" | "info" | "neutral" | "primary"

// ── Customers ────────────────────────────────────────────────────────
type CustomerRow = [string, string, number, string, string, string, PillTone, string, number, number[]]

const CUSTOMERS: CustomerRow[] = [
  ["Northridge Freight",     "Chicago, IL",      42,  "Carrier · annual",    "$7,056",  "Active",       "success", "2024-08-12", 87, [12,18,22,28,30,38,42,48,54,60,68,84]],
  ["Khaliq Hauling",         "Newark, NJ",       4,   "Free",                "$0",      "Free trial",   "info",    "2026-04-04", 92, [2,3,4,5,6,8,10,12,14,16,18,20]],
  ["Cascade Transport",      "Portland, OR",     62,  "Carrier · annual",    "$10,416", "Active",       "success", "2024-11-22", 81, [22,28,34,40,42,48,52,58,60,68,72,78]],
  ["Bekzod Transport",       "Boise, ID",        11,  "Carrier · monthly",   "$209",    "Active",       "success", "2025-02-15", 73, [4,6,8,9,11,14,17,20,22,24,26,28]],
  ["Stellar Dispatch",       "Dallas, TX",       18,  "Carrier · monthly",   "$342",    "Active",       "success", "2025-06-30", 79, [6,8,10,12,14,16,18,22,24,26,28,30]],
  ["Iron Hauling Co.",       "Indianapolis, IN", 8,   "Carrier · monthly",   "$152",    "Past due",     "warn",    "2025-09-10", 64, [3,4,5,6,7,8,9,11,12,11,10,9]],
  ["Meridian Logistics",     "Phoenix, AZ",      124, "Fleet · enterprise",  "$28,420", "Active",       "success", "2024-03-01", 88, [38,44,52,58,62,68,72,78,82,88,94,102]],
  ["Pacific Crown Trucking", "Long Beach, CA",   38,  "Carrier · annual",    "$6,384",  "Active",       "success", "2025-01-08", 84, [10,14,18,22,26,30,34,40,44,48,52,58]],
  ["Roadwise Dispatch",      "Atlanta, GA",      14,  "Carrier · monthly",   "$266",    "Active",       "success", "2025-11-12", 76, [4,6,8,10,12,14,16,18,20,22,24,26]],
  ["Velocity Trucking",      "Memphis, TN",      22,  "Carrier · annual",    "$3,696",  "Cancelling",   "danger",  "2024-06-22", 58, [18,20,22,18,16,14,12,10,8,6,4,2]],
]

export function AdminCustomers() {
  const kpis = [
    { lbl: "Total customers", v: "1,240",    d: "+47",    sub: "new this month" },
    { lbl: "MRR",             v: "$284,920", d: "+12.2%", sub: "expansion: $24,180" },
    { lbl: "Net retention",   v: "128%",     d: "+4pts",  sub: "NRR 12mo trailing" },
    { lbl: "At-risk",         v: "8",        d: "−2",     sub: "health < 60" },
  ]
  const tabs: Array<[string, number, boolean]> = [
    ["All", 1240, true], ["Active", 1180, false], ["Free trial", 42, false],
    ["Past due", 6, false], ["Cancelling", 12, false],
  ]
  return (
    <PageBody>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        {kpis.map((k) => (
          <Card key={k.lbl} padding={18}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase" }}>{k.lbl}</div>
              <Pill tone="success">{Ic.arrowUp} {k.d}</Pill>
            </div>
            <div style={{ fontFamily: FF.display, fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em", marginTop: 8 }}>{k.v}</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {tabs.map(([l, n, a]) => (
          <button key={l} style={{
            display: "inline-flex", gap: 8, padding: "7px 12px",
            background: a ? T.surface : "transparent",
            border: `1px solid ${a ? T.borderStrong : T.border}`,
            borderRadius: 4, color: a ? T.text : T.textDim, fontSize: 13, cursor: "pointer",
          }}>{l} <span style={{ fontFamily: FF.mono, color: T.textMute }}>{n}</span></button>
        ))}
        <div style={{ width: 1, alignSelf: "stretch", background: T.border, margin: "0 4px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, color: T.textDim }}>
          {Ic.search}<span style={{ fontSize: 13 }}>Search customer name, MC#, email…</span>
        </div>
        <Btn variant="secondary" size="md">{Ic.filter} Plan · All</Btn>
        <Btn variant="secondary" size="md">{Ic.download} Export</Btn>
        <Btn variant="primary" size="md">{Ic.plus} New customer</Btn>
      </div>

      <Card padding={0}>
        <div style={{
          display: "grid", gridTemplateColumns: "1.6fr 80px 1.1fr 120px 100px 110px 100px 80px",
          padding: "10px 18px", gap: 12, borderBottom: `1px solid ${T.border}`,
          fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          <div>Customer</div><div>Trucks</div><div>Plan</div>
          <div style={{ textAlign: "right" }}>MRR</div>
          <div>Status</div><div>Health</div><div>Joined</div><div>Trend</div>
        </div>
        {CUSTOMERS.map((r, i) => (
          <div key={r[0]} style={{
            display: "grid", gridTemplateColumns: "1.6fr 80px 1.1fr 120px 100px 110px 100px 80px",
            padding: "14px 18px", gap: 12, alignItems: "center",
            borderBottom: i < CUSTOMERS.length - 1 ? `1px solid ${T.divider}` : "none", fontSize: 13,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar initials={r[0].split(" ").slice(0,2).map((x) => x[0]).join("")} size={32} />
              <div>
                <div style={{ fontWeight: 500 }}>{r[0]}</div>
                <div style={{ fontFamily: FF.mono, fontSize: 11, color: T.textMute }}>{r[1]}</div>
              </div>
            </div>
            <span style={{ fontFamily: FF.mono, color: T.text }}>{r[2]}</span>
            <span style={{ color: T.textDim, fontSize: 12.5 }}>{r[3]}</span>
            <span style={{ fontFamily: FF.mono, color: r[4] === "$0" ? T.textMute : T.text, textAlign: "right", fontWeight: 500 }}>{r[4]}</span>
            <Pill tone={r[6]} dot>{r[5]}</Pill>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ScoreRing score={r[8]} size={26} />
              <span style={{ fontFamily: FF.mono, fontSize: 11, color: T.textDim }}>{r[8]}</span>
            </div>
            <span style={{ fontFamily: FF.mono, fontSize: 11, color: T.textMute }}>{r[7]}</span>
            <Spark data={r[9]} w={60} h={20} stroke={1.2} color={r[6] === "danger" ? T.danger : r[6] === "warn" ? T.warn : T.orange} />
          </div>
        ))}
      </Card>
    </PageBody>
  )
}

// ── Brokers DB ───────────────────────────────────────────────────────
type BrokerRow = [string, string, string, number, string, number, number, string, PillTone]
const GLOBAL_BROKERS: BrokerRow[] = [
  ["MC-114502", "CH Robinson",             "Eden Prairie, MN", 89, "A",  1842, 18420, "Verified",     "success"],
  ["MC-194820", "Schneider National",      "Green Bay, WI",    94, "A+", 1240, 28920, "Verified",     "success"],
  ["MC-839201", "Atlas Freight Brokers",   "Chicago, IL",      87, "A",  924,  12400, "Verified",     "success"],
  ["MC-330019", "XPO Logistics",           "Greenwich, CT",    84, "A",  2102, 38420, "Verified",     "success"],
  ["MC-880214", "Werner Enterprises",      "Omaha, NE",        91, "A",  768,  8240,  "Verified",     "success"],
  ["MC-440191", "Landstar System",         "Jacksonville, FL", 88, "A",  1284, 16240, "Verified",     "success"],
  ["MC-602811", "Total Quality Logistics", "Cincinnati, OH",   76, "B",  1942, 24180, "Verified",     "success"],
  ["MC-998120", "TCH Transport",           "Memphis, TN",      71, "B",  268,  6740,  "Verified",     "warn"],
  ["MC-512844", "Echo Global Logistics",   "Chicago, IL",      67, "B-", 1284, 18940, "Verified",     "warn"],
  ["MC-281042", "Coyote Logistics",        "Dallas, TX",       62, "C",  2418, 64210, "Verified",     "warn"],
  ["MC-441120", "Pinnacle Freight Co.",    "Atlanta, GA",      58, "C",  412,  12840, "Verified",     "warn"],
  ["MC-998244", "Stellar Logistics LLC",   "Fresno, CA",       54, "C-", 184,  5840,  "Auto-blocked", "warn"],
  ["MC-721903", "BlueWave Transport",      "Phoenix, AZ",      41, "D",  84,   0,     "Blocked",      "danger"],
  ["MC-882041", "Quickstrike Brokerage",   "Las Vegas, NV",    38, "D",  42,   0,     "Blocked",      "danger"],
]

export function AdminBrokers() {
  const kpis = [
    { lbl: "Brokers indexed",  v: "318,420", sub: "crawled + carrier-reported" },
    { lbl: "Vetted this month", v: "47,820",  sub: "across all customers" },
    { lbl: "Auto-blocked",     v: "4,128",   sub: "D + F grade · network-wide" },
    { lbl: "Carrier reports",  v: "+12,420", sub: "this week" },
  ]
  const watchlist: Array<[string, string, string, string]> = [
    ["BlueWave Transport",    "MC-721903", "824 blocks",  T.danger],
    ["Quickstrike Brokerage", "MC-882041", "612 blocks",  T.danger],
    ["Hauling Plus Co.",      "MC-441280", "484 blocks",  T.danger],
    ["Stellar Logistics LLC", "MC-998244", "218 blocks",  T.warn],
    ["Pinnacle Freight Co.",  "MC-441120", "142 watches", T.warn],
  ]
  const tabs: Array<[string, string, boolean]> = [
    ["All", "318k", true], ["Verified", "298k", false], ["Watch", "18k", false],
    ["Blocked", "4.1k", false], ["Unverified", "12k", false],
  ]
  return (
    <PageBody>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        {kpis.map((k) => (
          <Card key={k.lbl} padding={18}>
            <div style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase" }}>{k.lbl}</div>
            <div style={{ fontFamily: FF.display, fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em", marginTop: 8 }}>{k.v}</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 18 }}>
        <Card>
          <SectionHead eyebrow="Score distribution" title="Across 318k brokers" />
          <Bars data={[2100,8420,24820,62840,84210,72820,38420,18820,6240,1240]} h={180} labels={["0-10","11-20","21-30","31-40","41-50","51-60","61-70","71-80","81-90","91-100"]} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: FF.mono, fontSize: 11, color: T.textMute }}>
            <span>Median score: 64 · Mean: 61</span>
            <span>{Ic.arrowUp} +0.4 vs last quarter</span>
          </div>
        </Card>

        <Card padding={0}>
          <div style={{ padding: "18px 20px 12px", borderBottom: `1px solid ${T.border}` }}>
            <SectionHead eyebrow="Watchlist" title="Most-blocked brokers" style={{ marginBottom: 0 }} />
          </div>
          {watchlist.map((r, i) => (
            <div key={r[1]} style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 12, borderBottom: i < watchlist.length - 1 ? `1px solid ${T.divider}` : "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r[0]}</div>
                <div style={{ fontFamily: FF.mono, fontSize: 11, color: T.textMute }}>{r[1]}</div>
              </div>
              <span style={{ fontFamily: FF.mono, fontSize: 11.5, color: r[3] }}>{r[2]}</span>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
        {tabs.map(([l, n, a]) => (
          <button key={l} style={{
            display: "inline-flex", gap: 8, padding: "7px 12px",
            background: a ? T.surface : "transparent",
            border: `1px solid ${a ? T.borderStrong : T.border}`,
            borderRadius: 4, color: a ? T.text : T.textDim, fontSize: 13, cursor: "pointer",
          }}>{l} <span style={{ fontFamily: FF.mono, color: T.textMute }}>{n}</span></button>
        ))}
        <div style={{ flex: 1 }} />
        <Btn variant="secondary" size="md">{Ic.filter} FMCSA</Btn>
        <Btn variant="secondary" size="md">{Ic.download} Export</Btn>
        <Btn variant="primary" size="md">{Ic.plus} Add broker</Btn>
      </div>

      <Card padding={0}>
        <div style={{
          display: "grid", gridTemplateColumns: "130px 1.6fr 1.2fr 90px 60px 90px 130px 110px",
          padding: "10px 18px", gap: 12, borderBottom: `1px solid ${T.border}`,
          fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          <div>MC#</div><div>Broker</div><div>HQ</div><div>Score</div><div>Grade</div>
          <div>Vets</div><div style={{ textAlign: "right" }}>Recovered</div><div>Status</div>
        </div>
        {GLOBAL_BROKERS.map((r, i) => (
          <div key={r[0]} style={{
            display: "grid", gridTemplateColumns: "130px 1.6fr 1.2fr 90px 60px 90px 130px 110px",
            padding: "12px 18px", gap: 12, alignItems: "center",
            borderBottom: i < GLOBAL_BROKERS.length - 1 ? `1px solid ${T.divider}` : "none", fontSize: 13,
          }}>
            <span style={{ fontFamily: FF.mono, color: T.textDim }}>{r[0]}</span>
            <span style={{ color: T.text, fontWeight: 500 }}>{r[1]}</span>
            <span style={{ color: T.textDim, fontSize: 12 }}>{r[2]}</span>
            <span style={{ fontFamily: FF.mono, color: r[3] >= 70 ? T.success : r[3] >= 50 ? T.warn : T.danger, fontWeight: 600 }}>{r[3]}</span>
            <span style={{ fontFamily: FF.display, fontSize: 18, color: r[8] === "success" ? T.success : r[8] === "warn" ? T.warn : T.danger }}>{r[4]}</span>
            <span style={{ fontFamily: FF.mono, color: T.textDim }}>{r[5].toLocaleString()}</span>
            <span style={{ fontFamily: FF.mono, color: T.orange, textAlign: "right" }}>${r[6].toLocaleString()}</span>
            <Pill tone={r[8]} dot>{r[7]}</Pill>
          </div>
        ))}
      </Card>
    </PageBody>
  )
}

// ── AI Ops ───────────────────────────────────────────────────────────
export function AdminAIOps() {
  const kpis: Array<{ lbl: string; v: string; sub: string; tone: PillTone }> = [
    { lbl: "Pending review",   v: "47",    sub: "12 high-stakes",            tone: "primary" },
    { lbl: "Auto-actions · 24h", v: "8,420", sub: "96% auto-approved",         tone: "success" },
    { lbl: "Model confidence", v: "0.87",  sub: "avg across actions",         tone: "success" },
    { lbl: "Human overrides",  v: "2.4%",  sub: "↓ from 3.1% last week",      tone: "success" },
  ]
  const queue = [
    { id: "AI-2841", kind: "Score · auto-block",    subject: "BlueWave Transport · MC-721903",     verdict: "Block",          conf: 0.94, evidence: "2 bond claims · lapsed insurance · 84% network skip",      when: "8 min ago" },
    { id: "AI-2840", kind: "Claim · auto-draft",    subject: "CLM-4827 · $487.50 · Atlas Freight", verdict: "Send",           conf: 0.91, evidence: "GPS log + BOL + rate-con match · 6.5h dwell · clean lane",  when: "14 min ago" },
    { id: "AI-2839", kind: "Score · upgrade",       subject: "TQL · MC-602811 · B → B+",            verdict: "Approve",        conf: 0.82, evidence: "Pay speed 26d → 22d over 3 mo · 0 disputes",                when: "22 min ago" },
    { id: "AI-2838", kind: "Carrier feedback",      subject: "New review for Coyote Logistics",     verdict: "Surface",        conf: 0.78, evidence: "\"They paid faster than expected\" · low novelty · keep public", when: "42 min ago" },
    { id: "AI-2837", kind: "Claim · auto-draft",    subject: "CLM-4826 · $300 · Coyote",            verdict: "Hold for human", conf: 0.62, evidence: "BOL signature time unclear · ELD geofence ambiguous",       when: "1h ago" },
    { id: "AI-2836", kind: "Score · downgrade",     subject: "Pinnacle Frt. · C → D",               verdict: "Approve",        conf: 0.88, evidence: "3 disputes in 14 days · pay speed 44d → 52d",               when: "2h ago" },
  ]
  const metrics: Array<[string, number]> = [
    ["Precision", 0.94], ["Recall", 0.91], ["F1", 0.92], ["Calibration error", 0.04],
  ]
  return (
    <PageBody>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        {kpis.map((k) => (
          <Card key={k.lbl} padding={18}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase" }}>{k.lbl}</div>
              <Pill tone={k.tone} dot> </Pill>
            </div>
            <div style={{ fontFamily: FF.display, fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em", marginTop: 8 }}>{k.v}</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 18 }}>
        <Card padding={0}>
          <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AIBadge>Queue</AIBadge>
              <span style={{ fontFamily: FF.display, fontSize: 18, fontWeight: 600 }}>Pending AI decisions</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["All", "Score", "Claim", "Feedback"].map((p, i) => (
                <Btn key={p} variant={i === 0 ? "secondary" : "ghost"} size="sm">{p}</Btn>
              ))}
            </div>
          </div>
          {queue.map((r, i) => (
            <div key={r.id} style={{ padding: "16px 20px", borderBottom: i < queue.length - 1 ? `1px solid ${T.divider}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontFamily: FF.mono, fontSize: 11.5, color: T.orange }}>{r.id}</span>
                <Pill tone="neutral">{r.kind}</Pill>
                <span style={{ marginLeft: "auto", fontFamily: FF.mono, fontSize: 10.5, color: T.textMute }}>{r.when}</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{r.subject}</div>
                  <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 4, lineHeight: 1.4 }}>{r.evidence}</div>
                </div>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontFamily: FF.mono, fontSize: 10, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase" }}>Confidence</div>
                  <div style={{ fontFamily: FF.display, fontSize: 22, fontWeight: 500, color: r.conf >= 0.85 ? T.success : r.conf >= 0.7 ? T.warn : T.danger }}>{r.conf.toFixed(2)}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
                  <Pill tone={["Block","Send","Approve"].includes(r.verdict) ? "primary" : "warn"}>AI: {r.verdict}</Pill>
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    <Btn variant="primary" size="sm">{Ic.check}</Btn>
                    <Btn variant="secondary" size="sm">{Ic.x}</Btn>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <SectionHead eyebrow="Model · v4.2" title="Vetting model health" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {metrics.map(([k, v]) => (
                <div key={k}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: T.textDim }}>{k}</span>
                    <span style={{ fontFamily: FF.mono, color: T.success, fontWeight: 600 }}>{v.toFixed(2)}</span>
                  </div>
                  <div style={{ height: 4, background: T.border, borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                    <div style={{ width: v * 100 + "%", height: "100%", background: T.success }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: 10, background: T.orangeTint, borderRadius: 4, border: `1px solid ${T.borderStrong}`, fontSize: 12, color: T.text }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FF.mono, fontSize: 10, color: T.orangeDeep, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {Ic.sparkle} Retrain ready
              </div>
              <div style={{ marginTop: 4 }}>v4.3 candidate has +1.4pts F1. Promote after staging review.</div>
              <Btn variant="primary" size="sm" style={{ marginTop: 8 }}>Promote to canary</Btn>
            </div>
          </Card>

          <Card>
            <SectionHead eyebrow="Last 7 days" title="Auto-action mix" />
            <Bars data={[1240,1820,2240,1980,2480,2820,8420]} h={120} labels={["M","T","W","T","F","S","S"]} />
          </Card>
        </div>
      </div>
    </PageBody>
  )
}

// ── Revenue ──────────────────────────────────────────────────────────
export function AdminRevenue() {
  const labels = ["Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb"]
  const kpis = [
    { lbl: "MRR",       v: "$284,920", d: "+12.2%",        sub: "expansion: $24,180" },
    { lbl: "ARR",       v: "$3.42M",   d: "+18.4%",        sub: "YoY" },
    { lbl: "Net new",   v: "+$28,420", d: "+47 customers", sub: "gross adds this month" },
    { lbl: "Net churn", v: "−$4,240",  d: "−2.1%",         sub: "4 cancels · 2 downgrades" },
  ]
  const planMix: Array<[string, number, number, number, string]> = [
    ["Fleet · enterprise", 184_240, 0.65, 24,  T.orange],
    ["Carrier · annual",   78_420,  0.28, 614, T.success],
    ["Carrier · monthly",  22_260,  0.08, 602, T.warn],
    ["Free trial",         0,       0,    42,  T.textMute],
  ]
  const invoices: Array<[string, string, string, PillTone, string]> = [
    ["Meridian Logistics",  "$2,368", "Paid",     "success", "2h ago"],
    ["Cascade Transport",   "$868",   "Paid",     "success", "5h ago"],
    ["Stellar Dispatch",    "$342",   "Paid",     "success", "11h ago"],
    ["Iron Hauling Co.",    "$152",   "Past due", "warn",    "3d ago"],
    ["Pacific Crown",       "$532",   "Paid",     "success", "4d ago"],
    ["Velocity Trucking",   "$308",   "Refunded", "danger",  "5d ago"],
  ]
  return (
    <PageBody>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        {kpis.map((k) => (
          <Card key={k.lbl} padding={18}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase" }}>{k.lbl}</div>
              <Pill tone={k.lbl === "Net churn" ? "danger" : "success"}>{k.d}</Pill>
            </div>
            <div style={{ fontFamily: FF.display, fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em", marginTop: 8 }}>{k.v}</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 14 }}>
        <SectionHead
          eyebrow="Trailing 12 months"
          title="MRR build"
          action={
            <div style={{ display: "flex", gap: 4 }}>
              {["MRR","ARR","Cohorts","LTV"].map((p, i) => (
                <Btn key={p} variant={i === 0 ? "secondary" : "ghost"} size="sm">{p}</Btn>
              ))}
            </div>
          }
        />
        <div style={{ display: "flex", gap: 16, marginBottom: 10, fontFamily: FF.mono, fontSize: 11, color: T.textDim }}>
          {(
            [
              ["New", T.orange],
              ["Expansion", T.success],
              ["Churn", T.danger],
            ] as const
          ).map(([l, c]) => (
            <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 2, background: c }} /> {l}
            </span>
          ))}
        </div>
        <LineChart
          h={260}
          labels={labels}
          yFmt={(v) => "$" + (v / 1000).toFixed(0) + "k"}
          series={[
            { color: T.orange,  fill: true, data: [84,98,118,142,162,184,210,234,248,264,278,284].map((v) => v * 1000) },
            { color: T.success, data: [4,6,8,12,14,18,22,24,28,32,36,42].map((v) => v * 1000) },
            { color: T.danger,  data: [2,3,4,3,5,4,6,5,4,6,5,4].map((v) => v * 1000) },
          ]}
        />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14 }}>
        <Card>
          <SectionHead eyebrow="By plan" title="MRR distribution" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {planMix.map((r) => (
              <div key={r[0]}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: T.text }}>{r[0]} <span style={{ color: T.textMute, fontFamily: FF.mono, fontSize: 11, marginLeft: 6 }}>{r[3]} customers</span></span>
                  <span style={{ fontFamily: FF.mono, color: T.text, fontWeight: 500 }}>${r[1].toLocaleString()}</span>
                </div>
                <div style={{ height: 6, background: T.border, borderRadius: 3, marginTop: 6, overflow: "hidden" }}>
                  <div style={{ width: r[2] * 100 + "%", height: "100%", background: r[4] }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding={0}>
          <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${T.border}` }}>
            <SectionHead eyebrow="Last 7 days" title="Recent invoices" style={{ marginBottom: 0 }} />
          </div>
          {invoices.map((r, i) => (
            <div key={r[0]} style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 110px 80px", padding: "12px 20px", alignItems: "center", gap: 12, borderBottom: i < invoices.length - 1 ? `1px solid ${T.divider}` : "none", fontSize: 13 }}>
              <span style={{ color: T.text }}>{r[0]}</span>
              <span style={{ fontFamily: FF.mono, color: T.text, textAlign: "right", fontWeight: 500 }}>{r[1]}</span>
              <Pill tone={r[3]} dot>{r[2]}</Pill>
              <span style={{ fontFamily: FF.mono, fontSize: 11, color: T.textMute, textAlign: "right" }}>{r[4]}</span>
            </div>
          ))}
        </Card>
      </div>
    </PageBody>
  )
}

// ── Support ──────────────────────────────────────────────────────────
export function AdminSupport() {
  const kpis: Array<{ lbl: string; v: string; sub: string; tone: PillTone }> = [
    { lbl: "Open tickets",            v: "12",      sub: "4 high priority",  tone: "warn" },
    { lbl: "Median first-response",   v: "8.4 min", sub: "SLA: 15 min",       tone: "success" },
    { lbl: "Closed today",            v: "38",      sub: "94% one-touch",    tone: "success" },
    { lbl: "CSAT · 30d",              v: "4.8 / 5", sub: "218 responses",     tone: "success" },
  ]
  const tickets = [
    { id: "#4827", who: "Marisol Tate · Northridge Freight",  subj: "Extension not loading on DAT today",              priority: "High",   tone: "danger" as PillTone,  age: "12 min", assignee: "Aziz K." },
    { id: "#4826", who: "Devon A. · Cascade Transport",        subj: "Detention claim was disputed — need help",        priority: "High",   tone: "danger" as PillTone,  age: "38 min", assignee: "Aziz K." },
    { id: "#4825", who: "Reza K. · Khaliq Hauling",            subj: "Score for MC-281042 looks wrong, paid me fast",   priority: "Medium", tone: "warn" as PillTone,    age: "1h",     assignee: "Diyor R." },
    { id: "#4824", who: "Priya S. · Pacific Crown",            subj: "Trying to connect Geotab — getting 403 error",    priority: "Medium", tone: "warn" as PillTone,    age: "2h",     assignee: "Aziz K." },
    { id: "#4823", who: "Bekzod M. · Bekzod Transport",        subj: "How do I change auto-claim threshold to 3h?",     priority: "Low",    tone: "neutral" as PillTone, age: "3h",     assignee: "Diyor R." },
    { id: "#4822", who: "Otabek N. · Iron Hauling",            subj: "Cancelling — load board changed pricing",         priority: "High",   tone: "danger" as PillTone,  age: "5h",     assignee: "Aziz K." },
    { id: "#4821", who: "Marisol Tate · Northridge",           subj: "Can we add SSO for our team?",                    priority: "Low",    tone: "neutral" as PillTone, age: "6h",     assignee: "Aziz K." },
    { id: "#4820", who: "Sherzod A. · Stellar Dispatch",       subj: "Recovered $ deposited to wrong account",          priority: "High",   tone: "danger" as PillTone,  age: "8h",     assignee: "Diyor R." },
  ]
  const replies = [
    { conf: 0.91, body: "Hi Marisol — sorry about that. We're seeing a partial degradation on the DAT scraper as of 9:12am CT. The team is on it and we expect a fix by 11:30am. The score chips will backfill automatically once the connection is restored. I'll DM you the moment it's clear." },
    { conf: 0.82, body: "Try refreshing DAT One in the affected tab — the extension auto-reconnects on page load. If chips still don't appear in 60s, click the extension icon → \"Resync DAT\" at the bottom of the popup." },
    { conf: 0.74, body: "Quick fix that usually works: right-click the VettGuard icon → \"Reload extension\". Most loading issues clear in under 10 seconds. Let me know if it persists." },
  ]
  const tabs: Array<[string, number, boolean]> = [
    ["Open", 12, true], ["High", 4, false], ["Mine", 6, false], ["Unassigned", 1, false], ["Closed today", 38, false],
  ]

  return (
    <PageBody>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        {kpis.map((k) => (
          <Card key={k.lbl} padding={18}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontFamily: FF.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase" }}>{k.lbl}</div>
              <Pill tone={k.tone} dot> </Pill>
            </div>
            <div style={{ fontFamily: FF.display, fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em", marginTop: 8 }}>{k.v}</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
        {tabs.map(([l, n, a]) => (
          <button key={l} style={{
            display: "inline-flex", gap: 8, padding: "7px 12px",
            background: a ? T.surface : "transparent",
            border: `1px solid ${a ? T.borderStrong : T.border}`,
            borderRadius: 4, color: a ? T.text : T.textDim, fontSize: 13, cursor: "pointer",
          }}>{l} <span style={{ fontFamily: FF.mono, color: T.textMute }}>{n}</span></button>
        ))}
        <div style={{ flex: 1 }} />
        <Btn variant="secondary" size="md">{Ic.filter} Filters</Btn>
        <Btn variant="primary" size="md">{Ic.plus} New ticket</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <Card padding={0}>
          {tickets.map((r, i) => (
            <div key={r.id} style={{
              display: "grid", gridTemplateColumns: "70px 1fr 100px 80px 110px",
              padding: "14px 18px", gap: 12, alignItems: "center",
              borderBottom: i < tickets.length - 1 ? `1px solid ${T.divider}` : "none",
              background: i === 0 ? T.orangeTint : "transparent",
              fontSize: 13,
            }}>
              <span style={{ fontFamily: FF.mono, fontSize: 11.5, color: T.orange }}>{r.id}</span>
              <div>
                <div style={{ fontWeight: 500, color: T.text }}>{r.subj}</div>
                <div style={{ fontFamily: FF.mono, fontSize: 11, color: T.textMute, marginTop: 2 }}>{r.who}</div>
              </div>
              <Pill tone={r.tone} dot>{r.priority}</Pill>
              <span style={{ fontFamily: FF.mono, fontSize: 11, color: T.textMute }}>{r.age}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Avatar initials={r.assignee.split(" ").map((x) => x[0]).join("")} size={22} />
                <span style={{ fontSize: 12, color: T.textDim }}>{r.assignee.split(" ")[0]}</span>
              </div>
            </div>
          ))}
        </Card>

        <Card padding={0}>
          <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AIBadge>Suggested replies</AIBadge>
              <span style={{ fontFamily: FF.display, fontSize: 17, fontWeight: 600 }}>Ticket #4827</span>
            </div>
            <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 4 }}>
              &ldquo;Extension not loading on DAT today&rdquo;
            </div>
          </div>
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            {replies.map((r, i) => (
              <div key={i} style={{ padding: 14, border: `1px solid ${T.border}`, borderRadius: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Pill tone="primary">Suggestion {i + 1}</Pill>
                  <span style={{ fontFamily: FF.mono, fontSize: 11, color: T.textDim }}>conf {r.conf.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: 12.5, color: T.textDim, lineHeight: 1.5 }}>{r.body}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <Btn variant="primary" size="sm">Send</Btn>
                  <Btn variant="secondary" size="sm">Edit</Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageBody>
  )
}
