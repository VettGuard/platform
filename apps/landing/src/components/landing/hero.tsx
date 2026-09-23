"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import type { Locale } from "@vettguard/i18n/config"

import { Avatar, Btn, FF, Ic, Mark, Pill, ScoreRing, Spark, T, homeHref, waitlistHref } from "./dsl"
import { CHROME_STORE_URL, SIGN_IN_URL } from "./links"
import { LocaleSwitcher } from "./locale-switcher"
import { ThemeToggle } from "./theme-toggle"

// ──────────────────────────────────────────────────────────────────────
// LandingNav — sticky, glassy
// ──────────────────────────────────────────────────────────────────────
export function LandingNav({ locale }: { locale: Locale }) {
  const t = useTranslations("landing.nav")
  const blogHref = locale === "en" ? "/blog" : `/${locale}/blog`
  return (
    <nav
      aria-label="Primary"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 56px",
        background: T.glass,
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: `1px solid ${T.border}`,
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <Mark color={T.text} href={homeHref(locale)} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          fontSize: 14,
          fontWeight: 500,
          color: T.textDim,
          letterSpacing: "-0.005em",
        }}
      >
        <a href="#extension" style={{ color: "inherit" }}>{t("extension")}</a>
        <a href="#how-it-works" style={{ color: "inherit" }}>{t("howItWorks")}</a>
        <a href="#pricing" style={{ color: "inherit" }}>{t("pricing")}</a>
        <a href="#carriers" style={{ color: "inherit" }}>{t("carriers")}</a>
        <a href={blogHref} style={{ color: "inherit" }}>{t("blog")}</a>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <LocaleSwitcher current={locale} />
        <ThemeToggle label={t("toggleTheme")} />
        <Btn variant="ghost" size="md" href={SIGN_IN_URL}>
          {t("signIn")}
        </Btn>
        <Btn
          variant="accent"
          size="md"
          href={waitlistHref(locale)}
          style={{
            boxShadow:
              "0 1px 2px rgba(214,58,5,0.22), 0 4px 14px -2px rgba(214,58,5,0.30), inset 0 1px 0 rgba(255,255,255,0.22)",
            paddingLeft: 18,
            paddingRight: 18,
          }}
        >
          {Ic.sparkle} {t("joinWaitlist")}
        </Btn>
      </div>
    </nav>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Hero — left copy + right product demo
// ──────────────────────────────────────────────────────────────────────
export function Hero() {
  const t = useTranslations("landing.hero")
  const [recovered, setRecovered] = useState(2_846_290)
  useEffect(() => {
    const id = setInterval(
      () => setRecovered((v) => v + Math.floor(40 + Math.random() * 180)),
      1500,
    )
    return () => clearInterval(id)
  }, [])

  return (
    <section
      style={{
        padding: "72px 56px 96px",
        display: "grid",
        gridTemplateColumns: "1fr 1.05fr",
        gap: 56,
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        backgroundImage: T.gradient,
        backgroundColor: T.bg,
      }}
    >
      <div style={{ position: "relative", zIndex: 1 }}>
        <Pill tone="ai" style={{ marginBottom: 22 }} className="vg-enter vg-enter-1">
          <span style={{ color: T.orange, display: "flex" }}>{Ic.sparkle}</span>
          {t("pill")}
        </Pill>
        <h1
          className="vg-enter vg-enter-2"
          style={{
            fontFamily: FF.display,
            fontWeight: 600,
            fontSize: 68,
            lineHeight: 1.02,
            letterSpacing: "-0.035em",
            margin: "0 0 22px",
            color: T.text,
          }}
        >
          {t("headlineLead")}{" "}
          <span
            style={{
              fontFamily: FF.italic,
              fontStyle: "italic",
              fontWeight: 400,
              color: T.orange,
              letterSpacing: "-0.02em",
            }}
          >
            {t("headlineItalic")}
          </span>{" "}
          {t("headlineRest")}
        </h1>
        <p
          className="vg-enter vg-enter-3"
          style={{
            fontSize: 19,
            lineHeight: 1.5,
            color: T.textDim,
            maxWidth: 540,
            margin: "0 0 32px",
            letterSpacing: "-0.005em",
          }}
        >
          {t("subtitle")}
        </p>
        <div className="vg-enter vg-enter-4" style={{ display: "flex", gap: 10, marginBottom: 36 }}>
          <Btn variant="primary" size="lg" href={CHROME_STORE_URL}>
            {Ic.puzzle} {t("ctaPrimary")}
          </Btn>
          <Btn variant="secondary" size="lg" href="#extension">
            {t("ctaSecondary")} {Ic.arrowR}
          </Btn>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            fontSize: 13,
            color: T.textDim,
          }}
        >
          <Avatar initials="MT" size={26} />
          <Avatar initials="DA" size={26} color="#D9E0CC" />
          <Avatar initials="RK" size={26} color="#E4D3DA" />
          <Avatar initials="JS" size={26} color="#E0D2E0" />
          <span>{t("socialProof")}</span>
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <HeroDemo recovered={recovered} />
      </div>
    </section>
  )
}

type DemoTone = "success" | "warn" | "danger"
type DemoRow = {
  from: string
  to: string
  mi: number
  rate: string
  broker: string
  score: number
  tone: DemoTone
  summary: string
  detail: string
  stats: ReadonlyArray<readonly [string, string, DemoTone]>
  aiHint: string
}

const DEMO_ROWS: readonly DemoRow[] = [
  { from: "Chicago, IL", to: "Houston, TX", mi: 1086, rate: "$2,840", broker: "Atlas Freight", score: 87, tone: "success",
    summary: "Book confidently", detail: "Pays in 18 days · 96% paid rate",
    stats: [["Pay speed", "18 days", "success"], ["On-time rate", "96%", "success"], ["Detention disputes", "4%", "success"]],
    aiHint: "Network consensus: book with confidence." },
  { from: "Memphis, TN", to: "Atlanta, GA", mi: 392, rate: "$1,720", broker: "CH Robinson", score: 89, tone: "success",
    summary: "Top-tier broker", detail: "Pays in 17 days · 244 of your loads",
    stats: [["Pay speed", "17 days", "success"], ["On-time rate", "98%", "success"], ["Carrier reviews", "4.8/5", "success"]],
    aiHint: "Network consensus: book with confidence." },
  { from: "Dallas, TX", to: "Phoenix, AZ", mi: 1067, rate: "$3,420", broker: "BlueWave Trans.", score: 41, tone: "danger",
    summary: "Avoid this load", detail: "Pays in 62 days · 3 missed",
    stats: [["Insurance", "Lapsed", "danger"], ["Bond claims", "2 in 12mo", "danger"], ["Carrier reviews", "1.8/5 (84)", "warn"]],
    aiHint: "84% of carriers avoided this in the last 30 days." },
  { from: "Indy, IN", to: "Columbus, OH", mi: 178, rate: "$1,210", broker: "XPO Logistics", score: 84, tone: "success",
    summary: "Reliable payer", detail: "Pays in 21 days · 152 loads",
    stats: [["Pay speed", "21 days", "success"], ["On-time rate", "92%", "success"], ["Carrier reviews", "4.5/5", "success"]],
    aiHint: "Network consensus: book with confidence." },
  { from: "St. Louis, MO", to: "Nashville, TN", mi: 309, rate: "$1,680", broker: "Pinnacle Frt.", score: 58, tone: "warn",
    summary: "Watch closely", detail: "Pay speed slipped (44d → 52d)",
    stats: [["Pay speed", "52 days", "warn"], ["Trend", "Slowing 14d", "warn"], ["Disputes", "17%", "warn"]],
    aiHint: "Watch closely — confidence dropped this week." },
  { from: "Detroit, MI", to: "Pittsburgh, PA", mi: 287, rate: "$1,420", broker: "Echo Global", score: 67, tone: "warn",
    summary: "Caution advised", detail: "New disputes filed this week",
    stats: [["Pay speed", "29 days", "warn"], ["Trend", "Slowing 7d", "warn"], ["Disputes", "11%", "warn"]],
    aiHint: "Watch closely — confidence dropped this week." },
  { from: "Phoenix, AZ", to: "Denver, CO", mi: 602, rate: "$2,180", broker: "Landstar", score: 88, tone: "success",
    summary: "Top-tier broker", detail: "Pays in 19 days · 67 loads",
    stats: [["Pay speed", "19 days", "success"], ["On-time rate", "94%", "success"], ["Carrier reviews", "4.6/5", "success"]],
    aiHint: "Network consensus: book with confidence." },
]

function HeroDemo({ recovered }: { recovered: number }) {
  const t = useTranslations("landing.hero.demo")
  const [activeIdx, setActiveIdx] = useState(2)
  useEffect(() => {
    const id = setInterval(
      () => setActiveIdx((i) => (i + 1) % DEMO_ROWS.length),
      2400,
    )
    return () => clearInterval(id)
  }, [])
  const selected = DEMO_ROWS[activeIdx]!
  const rows = DEMO_ROWS

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          background: T.surface,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow:
            "0 40px 80px -20px rgba(10,14,20,0.20), 0 4px 12px rgba(10,14,20,0.06), 0 0 0 1px rgba(10,14,20,0.06)",
        }}
      >
        {/* Chrome tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 4,
            padding: "8px 12px 0",
            background: T.chromeTabs,
          }}
        >
          {[
            ["DAT One — Load board", true, true],
            ["Inbox · 4", false, false],
          ].map(([name, active, hasShield], i) => (
            <div
              key={i}
              style={{
                background: active ? T.surface : "transparent",
                padding: "8px 14px",
                borderRadius: "8px 8px 0 0",
                fontSize: 12,
                color: active ? T.text : T.textDim,
                display: "flex",
                alignItems: "center",
                gap: 8,
                maxWidth: 220,
                border: active ? `1px solid ${T.border}` : "none",
                borderBottom: "none",
              }}
            >
              {hasShield && (
                <svg width="14" height="14" viewBox="0 0 32 32">
                  <path
                    d="M16 4 L26 9 V19 C26 23 21 27 16 28 C11 27 6 23 6 19 V9 Z"
                    fill={T.orange}
                  />
                </svg>
              )}
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {name as string}
              </span>
              <span style={{ color: T.textMute, fontSize: 11 }}>×</span>
            </div>
          ))}
        </div>
        {/* URL bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 14px",
            background: T.chromeUrl,
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <span style={{ color: T.textMute, fontSize: 14 }}>←</span>
          <span style={{ color: T.textMute, fontSize: 14 }}>→</span>
          <span style={{ color: T.textMute, fontSize: 14 }}>↻</span>
          <div
            style={{
              flex: 1,
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              padding: "5px 14px",
              fontSize: 12,
              color: T.textDim,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: T.success }}>⚭</span>
            <span style={{ fontFamily: FF.mono }}>
              power.dat.com/search/results
            </span>
          </div>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: T.orange,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 32 32">
              <path
                d="M16 3 L28 9 V20 C28 25 22 29 16 30 C10 29 4 25 4 20 V9 Z"
                fill="#fff"
              />
            </svg>
            <span
              style={{
                position: "absolute",
                top: -3,
                right: -3,
                background: T.text,
                color: "#fff",
                fontSize: 9,
                padding: "1px 5px",
                borderRadius: 999,
                fontFamily: FF.mono,
                fontWeight: 600,
              }}
            >
              4
            </span>
          </div>
        </div>

        {/* Page body: DAT-ish load board left, our extension panel right */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            background: T.surface,
            height: 440,
          }}
        >
          <div
            style={{
              padding: 14,
              borderRight: `1px solid ${T.border}`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: T.textDim,
                  fontFamily: FF.mono,
                }}
              >
                {t("loadBoardCount")}
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                {[t("originHeader"), t("destinationHeader"), t("rateHeader")].map((l) => (
                  <span
                    key={l}
                    style={{
                      fontSize: 10.5,
                      padding: "3px 8px",
                      background: T.surfaceElev,
                      color: T.textDim,
                      borderRadius: 3,
                      fontFamily: FF.mono,
                    }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
            {rows.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 56px 70px 1fr 28px",
                  gap: 8,
                  alignItems: "center",
                  padding: "9px 10px",
                  borderBottom: `1px solid ${T.divider}`,
                  background: i === activeIdx ? T.orangeTint : "transparent",
                  fontSize: 12,
                  transition: "background .25s ease",
                }}
              >
                <span
                  style={{
                    color: T.text,
                    fontWeight: i === activeIdx ? 600 : 400,
                  }}
                >
                  {r.from}
                </span>
                <span style={{ color: T.text }}>{r.to}</span>
                <span
                  style={{
                    color: T.textMute,
                    fontFamily: FF.mono,
                    fontSize: 11,
                  }}
                >
                  {r.mi}mi
                </span>
                <span
                  style={{
                    color: T.text,
                    fontFamily: FF.mono,
                    fontWeight: 500,
                  }}
                >
                  {r.rate}
                </span>
                <span style={{ color: T.textDim }}>{r.broker}</span>
                <span
                  style={{
                    width: 26,
                    height: 22,
                    borderRadius: 3,
                    background:
                      r.tone === "success"
                        ? T.successSoft
                        : r.tone === "warn"
                          ? T.warnSoft
                          : T.dangerSoft,
                    color:
                      r.tone === "success"
                        ? T.success
                        : r.tone === "warn"
                          ? T.warn
                          : T.danger,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FF.sans,
                    fontWeight: 700,
                    fontSize: 11,
                    border: `1px solid ${
                      r.tone === "success"
                        ? "#B5DEC4"
                        : r.tone === "warn"
                          ? "#E2C885"
                          : "#F0B9B0"
                    }`,
                    transform: i === activeIdx ? "scale(1.18)" : "scale(1)",
                    transformOrigin: "center",
                    boxShadow:
                      i === activeIdx
                        ? `0 0 0 3px ${
                            r.tone === "success"
                              ? "#B5DEC4"
                              : r.tone === "warn"
                                ? "#E2C885"
                                : "#F0B9B0"
                          }`
                        : "none",
                    transition: "all .25s ease",
                  }}
                >
                  {r.score}
                </span>
              </div>
            ))}
          </div>

          {/* Right side — extension panel */}
          <div
            style={{
              padding: 16,
              background: T.surfaceAlt,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Mark size={18} withText={false} />
              <span style={{ fontFamily: FF.display, fontSize: 16 }}>
                VettGuard
              </span>
              <span style={{ marginLeft: "auto" }}>
                <Pill tone="success" dot>
                  {t("live")}
                </Pill>
              </span>
            </div>
            <div
              style={{
                padding: 12,
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  fontFamily: FF.mono,
                  fontSize: 10.5,
                  color: T.textMute,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {t("selectedLabel")} · {selected.broker}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 10,
                }}
              >
                <ScoreRing score={selected.score} size={56} label="risk" />
                <div>
                  <div
                    style={{
                      fontFamily: FF.display,
                      fontSize: 17,
                      fontWeight: 600,
                    }}
                  >
                    {selected.summary}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: T.textDim,
                      marginTop: 2,
                    }}
                  >
                    {selected.detail}
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontSize: 11.5,
                  color: T.textDim,
                }}
              >
                {selected.stats.map(([k, v, tn], i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{k}</span>
                    <span
                      style={{
                        color:
                          tn === "danger"
                            ? T.danger
                            : tn === "warn"
                              ? T.warn
                              : T.success,
                        fontFamily: FF.mono,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 12,
                  padding: "8px 10px",
                  background: T.orangeTint,
                  color: T.text,
                  borderRadius: 6,
                  border: "1px solid #FFD2B8",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11.5,
                }}
              >
                <span style={{ color: T.orangeDeep, display: "flex" }}>
                  {Ic.sparkle}
                </span>
                <span>
                  <span style={{ color: T.orangeDeep, fontWeight: 600 }}>
                    AI:
                  </span>{" "}
                  {selected.aiHint}
                </span>
              </div>
            </div>

            <div
              style={{
                padding: 12,
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  fontFamily: FF.mono,
                  fontSize: 10.5,
                  color: T.textMute,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {t("recoveredLabel")}
              </div>
              <div
                style={{
                  fontFamily: FF.display,
                  fontSize: 30,
                  fontWeight: 500,
                  color: T.text,
                  marginTop: 4,
                }}
              >
                ${(recovered / 1000).toFixed(1)}k
                <span
                  style={{
                    fontFamily: FF.mono,
                    fontSize: 11,
                    color: T.success,
                    marginLeft: 8,
                  }}
                >
                  {t("trendUp")}
                </span>
              </div>
              <Spark
                data={[10, 14, 18, 22, 30, 28, 38, 46, 52, 60, 68, recovered / 30000]}
                w={240}
                h={32}
              />
            </div>

            <Btn
              variant="primary"
              size="md"
              href="#waitlist"
              style={{ width: "100%" }}
            >
              {Ic.bolt} {t("trackButton")}
            </Btn>
          </div>
        </div>
      </div>

      {/* Floating "live · auto-recovered" badge */}
      <div
        style={{
          position: "absolute",
          bottom: -22,
          left: -22,
          background: "#0A0E14",
          color: "#FFFFFF",
          padding: "14px 18px",
          borderRadius: 10,
          boxShadow:
            "0 20px 50px rgba(10,14,20,0.30), inset 0 0 0 1px rgba(255,255,255,0.06)",
          minWidth: 230,
        }}
      >
        <div
          style={{
            fontFamily: FF.mono,
            fontSize: 10,
            color: "#A89F92",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: T.orange,
              boxShadow: `0 0 0 4px ${T.orange}33`,
            }}
          />
          {t("liveBadge")}
        </div>
        <div
          style={{
            fontFamily: FF.display,
            fontSize: 22,
            fontWeight: 500,
            marginTop: 4,
          }}
        >
          ${recovered.toLocaleString()}
        </div>
        <div style={{ fontSize: 11.5, color: "#A89F92", marginTop: 2 }}>
          {t("yearToDate")}
        </div>
      </div>
    </div>
  )
}
