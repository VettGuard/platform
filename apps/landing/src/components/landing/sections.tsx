"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"

import { Btn, Card, FF, Ic, Mark, Pill, SectionHead, T, homeHref } from "./dsl"
import {
  BOOK_CALL_URL,
  CHROME_STORE_URL,
  footerLinks,
  SALES_EMAIL,
  SIGN_UP_URL,
} from "./links"
import { WaitlistForm } from "./waitlist-form"

// ──────────────────────────────────────────────────────────────────────
// TrustBar
// ──────────────────────────────────────────────────────────────────────
export function TrustBar() {
  const t = useTranslations("landing.trustBar")
  return (
    <section
      style={{
        padding: "24px 56px",
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 32,
        background: T.bg,
      }}
    >
      <div
        style={{
          fontFamily: FF.mono,
          fontSize: 11,
          color: T.textMute,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {t("livesInside")}
      </div>
      {/* Brand names — proper nouns, kept verbatim across all locales. */}
      {["DAT One", "Truckstop", "123Loadboard", "NextLoad", "Direct Freight", "Trucker Path"].map((n) => (
        <span
          key={n}
          style={{
            fontFamily: FF.display,
            fontSize: 18,
            color: T.textDim,
            letterSpacing: "0.04em",
          }}
        >
          {n}
        </span>
      ))}
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Benefits — 3 stat cards
// ──────────────────────────────────────────────────────────────────────
export function Benefits() {
  const t = useTranslations("landing.benefits")
  const keys = ["vetting", "detention", "native"] as const
  return (
    <section id="carriers" style={{ padding: "96px 56px", background: T.bg }}>
      <SectionHead eyebrow={t("eyebrow")} title={t("title")} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginTop: 32,
        }}
      >
        {keys.map((k) => (
          <Card
            key={k}
            padding={28}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              minHeight: 280,
            }}
          >
            <Pill tone="primary">{t(`items.${k}.eyebrow`)}</Pill>
            <h3
              style={{
                fontFamily: FF.display,
                fontSize: 26,
                fontWeight: 600,
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
                margin: 0,
              }}
            >
              {t(`items.${k}.title`)}
            </h3>
            <p
              style={{
                fontSize: 14.5,
                color: T.textDim,
                lineHeight: 1.5,
                margin: 0,
                flex: 1,
              }}
            >
              {t(`items.${k}.body`)}
            </p>
            <div
              style={{
                paddingTop: 16,
                borderTop: `1px solid ${T.divider}`,
                display: "flex",
                alignItems: "baseline",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontFamily: FF.display,
                  fontSize: 28,
                  color: T.orange,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                }}
              >
                {t(`items.${k}.stat`)}
              </span>
              <span style={{ fontSize: 12, color: T.textMute }}>
                {t(`items.${k}.statLbl`)}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────
// ExtensionShowcase — 3 product moments
// ──────────────────────────────────────────────────────────────────────
export function ExtensionShowcase() {
  const t = useTranslations("landing.showcase")
  const moments = [
    { key: "chips", visual: <ChipVisual /> },
    { key: "hover", visual: <HoverVisual /> },
    { key: "claim", visual: <ClaimVisual /> },
  ] as const
  return (
    <section
      id="extension"
      style={{
        padding: "96px 56px",
        background: T.surfaceAlt,
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <SectionHead eyebrow={t("eyebrow")} title={t("title")} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 14,
          marginTop: 32,
        }}
      >
        {moments.map((m, i) => (
          <div key={m.key} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card
              padding={0}
              style={{
                overflow: "hidden",
                height: 260,
                background: T.bg,
                position: "relative",
              }}
            >
              <div style={{ position: "absolute", inset: 0, padding: 18 }}>
                {m.visual}
              </div>
            </Card>
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
                {t("step")} {i + 1}
              </div>
              <h4
                style={{
                  fontFamily: FF.display,
                  fontSize: 22,
                  fontWeight: 600,
                  margin: "4px 0 8px",
                  letterSpacing: "-0.01em",
                }}
              >
                {t(`moments.${m.key}.title`)}
              </h4>
              <p style={{ fontSize: 14, color: T.textDim, margin: 0, lineHeight: 1.5 }}>
                {t(`moments.${m.key}.body`)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ChipVisual() {
  // Broker names + load-board name are brand data — verbatim across locales.
  const rows: Array<{ name: string; score: number; tone: "success" | "warn" | "danger" }> = [
    { name: "Atlas Freight", score: 87, tone: "success" },
    { name: "CH Robinson", score: 89, tone: "success" },
    { name: "BlueWave Tr.", score: 41, tone: "danger" },
    { name: "XPO Logistics", score: 84, tone: "success" },
    { name: "Pinnacle Frt.", score: 58, tone: "warn" },
    { name: "Echo Global", score: 67, tone: "warn" },
  ]
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 4,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          borderBottom: `1px solid ${T.border}`,
          fontFamily: FF.mono,
          fontSize: 10.5,
          color: T.textMute,
        }}
      >
        DAT load board · 247
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "7px 12px",
            borderBottom: i < rows.length - 1 ? `1px solid ${T.divider}` : "none",
            fontSize: 12,
          }}
        >
          <span style={{ color: T.text }}>{r.name}</span>
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
              fontWeight: 700,
              fontSize: 11,
              border: `1px solid ${
                r.tone === "success" ? "#B5DEC4" : r.tone === "warn" ? "#E2C885" : "#F0B9B0"
              }`,
            }}
          >
            {r.score}
          </span>
        </div>
      ))}
    </div>
  )
}

function HoverVisual() {
  const t = useTranslations("landing.showcase.hover")
  return (
    <div style={{ position: "relative", height: "100%" }}>
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          padding: "7px 12px",
          fontSize: 12,
          color: T.text,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>BlueWave Transport</span>
        <span
          style={{
            width: 26,
            height: 22,
            borderRadius: 3,
            background: T.dangerSoft,
            color: T.danger,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 11,
            border: `1px solid #F0B9B0`,
          }}
        >
          41
        </span>
      </div>
      {/* Always-dark tooltip — decorative variant; intentional. */}
      <div
        style={{
          position: "absolute",
          top: 36,
          left: 10,
          width: 240,
          background: "#0A0E14",
          color: "#F2EFE9",
          borderRadius: 6,
          padding: 14,
          boxShadow: "0 20px 40px rgba(26,23,20,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: FF.mono,
            fontSize: 10,
            color: T.orange,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {Ic.sparkle} {t("summary")}
        </div>
        <div
          style={{
            fontFamily: FF.display,
            fontSize: 17,
            marginTop: 6,
            fontWeight: 500,
          }}
        >
          {t("scoreLine")}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#A89F92",
            marginTop: 2,
            lineHeight: 1.45,
          }}
        >
          {t("body")}
        </div>
        <div
          style={{
            marginTop: 10,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 11,
          }}
        >
          {(
            [
              [t("paySpeed"), "62d", "danger"],
              [t("bondClaims"), "2/12mo", "danger"],
              [t("disputes"), "17%", "warn"],
            ] as const
          ).map(([k, v, tn], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#A89F92" }}>{k}</span>
              <span
                style={{
                  color: tn === "danger" ? "#FF8866" : "#FFCB66",
                  fontFamily: FF.mono,
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ClaimVisual() {
  const t = useTranslations("landing.showcase.claim")
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          padding: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: FF.mono,
            fontSize: 10.5,
            color: T.textMute,
          }}
        >
          {Ic.clock} {t("arrivalLabel")}
        </div>
        <div style={{ fontSize: 13, color: T.text, marginTop: 4 }}>
          {t("arrivalBody")}
        </div>
      </div>
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          padding: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: FF.mono,
            fontSize: 10.5,
            color: T.warn,
          }}
        >
          {Ic.alert} {t("thresholdLabel")}
        </div>
        <div style={{ fontSize: 13, color: T.text, marginTop: 4 }}>
          {t("thresholdBody")}
        </div>
      </div>
      <div
        style={{
          background: T.orangeTint,
          border: `1px solid #FFC9AB`,
          borderRadius: 4,
          padding: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: FF.mono,
            fontSize: 10.5,
            color: T.orangeDeep,
            fontWeight: 600,
          }}
        >
          {Ic.sparkle} {t("draftedLabel")}
        </div>
        <div
          style={{
            fontSize: 13,
            color: T.text,
            marginTop: 4,
            fontWeight: 500,
          }}
        >
          {t("draftedBody")}
        </div>
        <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>
          {t("draftedAttachments")}
        </div>
        <Btn
          variant="primary"
          size="sm"
          href="#waitlist"
          style={{ marginTop: 10, width: "100%" }}
        >
          {Ic.check} {t("approve")}
        </Btn>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// HowItWorks
// ──────────────────────────────────────────────────────────────────────
export function HowItWorks() {
  const t = useTranslations("landing.howItWorks")
  // next-intl: arrays accessed via raw lookup. JSON guarantees the shape.
  const steps = t.raw("steps") as Array<{ title: string; body: string }>

  return (
    <section id="how-it-works" style={{ padding: "96px 56px", background: T.bg }}>
      <div style={{ maxWidth: 720 }}>
        <SectionHead eyebrow={t("eyebrow")} title={t("title")} />
        <p style={{ fontSize: 17, color: T.textDim, lineHeight: 1.5, margin: 0 }}>
          {t("subtitle")}
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginTop: 40,
        }}
      >
        {steps.map((step, i) => (
          <Card key={i} padding={28}>
            <div
              style={{
                fontFamily: FF.display,
                fontSize: 56,
                color: T.orange,
                lineHeight: 1,
                letterSpacing: "-0.04em",
                fontWeight: 400,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <h4
              style={{
                fontFamily: FF.display,
                fontSize: 22,
                fontWeight: 600,
                margin: "20px 0 8px",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              {step.title}
            </h4>
            <p style={{ fontSize: 14, color: T.textDim, margin: 0, lineHeight: 1.5 }}>
              {step.body}
            </p>
          </Card>
        ))}
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Pricing — Free + Pro
// ──────────────────────────────────────────────────────────────────────
export function Pricing() {
  const t = useTranslations("landing.pricing")
  const freeLines = t.raw("free.features") as string[][]
  const proLines = t.raw("pro.features") as string[][]

  return (
    <section
      id="pricing"
      style={{
        padding: "96px 56px",
        background: T.surfaceAlt,
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 48px" }}>
        <div
          style={{
            fontFamily: FF.sans,
            fontSize: 12,
            fontWeight: 600,
            color: T.orange,
            letterSpacing: "-0.005em",
          }}
        >
          {t("eyebrow")}
        </div>
        <h2
          style={{
            fontFamily: FF.display,
            fontSize: 56,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            margin: "8px 0 14px",
            color: T.text,
          }}
        >
          {t("titleLead")}{" "}
          <span
            style={{
              fontFamily: FF.italic,
              fontStyle: "italic",
              fontWeight: 400,
              color: T.orange,
              letterSpacing: "-0.02em",
            }}
          >
            {t("titleItalic")}
          </span>{" "}
          {t("titleRest")}
        </h2>
        <p
          style={{
            fontSize: 17,
            color: T.textDim,
            margin: 0,
            lineHeight: 1.5,
            letterSpacing: "-0.005em",
            maxWidth: 620,
            marginInline: "auto",
          }}
        >
          {t("subtitle")}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
          maxWidth: 1080,
          margin: "0 auto",
        }}
      >
        {/* FREE */}
        <div
          style={{
            background: T.surface,
            color: T.text,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: 36,
            boxShadow: "0 1px 2px rgba(10,14,20,0.04)",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontFamily: FF.display,
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              {t("free.name")}
            </div>
            <Pill tone="neutral">{t("free.badge")}</Pill>
          </div>
          <div style={{ fontSize: 14, color: T.textDim, marginBottom: 24 }}>
            {t("free.desc")}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontFamily: FF.display,
                fontSize: 72,
                fontWeight: 600,
                letterSpacing: "-0.045em",
                color: T.text,
                lineHeight: 1,
              }}
            >
              {t("free.price")}
            </span>
            <span style={{ fontSize: 14, color: T.textDim }}>{t("free.per")}</span>
          </div>
          <div
            style={{
              fontFamily: FF.mono,
              fontSize: 12,
              color: T.textDim,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>{t("free.plus18")}</span>
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: T.textMute,
              }}
            />
            <span style={{ color: T.textMute }}>{t("free.guarantee")}</span>
          </div>
          <Btn
            variant="primary"
            size="md"
            href={CHROME_STORE_URL}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {t("free.cta")}
          </Btn>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "28px 0 0",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {freeLines.map(([head, sub], j) => (
              <li
                key={j}
                style={{
                  display: "flex",
                  gap: 10,
                  fontSize: 13.5,
                  color: T.textDim,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ color: T.success, marginTop: 2, display: "flex" }}>
                  {Ic.check}
                </span>
                <span>
                  <span style={{ color: T.text }}>{head}.</span>{" "}
                  <span style={{ color: T.textMute }}>{sub}.</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* PRO — always-inverse dark card */}
        <div
          style={{
            background: "#0A0E14",
            color: "#F2EFE9",
            border: "1px solid #0A0E14",
            borderRadius: 16,
            padding: 36,
            boxShadow:
              "0 20px 40px -8px rgba(10,14,20,0.25), inset 0 0 0 1px rgba(255,255,255,0.04)",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontFamily: FF.display,
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#FFFFFF",
              }}
            >
              {t("pro.name")}
            </div>
            <Pill style={{ background: T.orange, color: "#fff", border: "none" }}>
              {t("pro.badge")}
            </Pill>
          </div>
          <div style={{ fontSize: 14, color: "#A89F92", marginBottom: 24 }}>
            {t("pro.desc")}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontFamily: FF.display,
                fontSize: 72,
                fontWeight: 600,
                letterSpacing: "-0.045em",
                color: "#FFFFFF",
                lineHeight: 1,
              }}
            >
              {t("pro.price")}
            </span>
            <span style={{ fontSize: 14, color: "#A89F92" }}>{t("pro.per")}</span>
          </div>
          <div
            style={{
              fontFamily: FF.mono,
              fontSize: 12,
              color: "#A89F92",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>{t("pro.plus18")}</span>
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#6B7280",
              }}
            />
            <span style={{ color: "#6B7280" }}>{t("pro.trial")}</span>
          </div>
          <Btn
            variant="accent"
            size="md"
            href={SIGN_UP_URL}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {t("pro.cta")}
          </Btn>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "28px 0 0",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {proLines.map(([head, sub], j) => (
              <li
                key={j}
                style={{
                  display: "flex",
                  gap: 10,
                  fontSize: 13.5,
                  color: "#D9D2C5",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ color: T.orange, marginTop: 2, display: "flex" }}>
                  {Ic.check}
                </span>
                <span>
                  <span style={{ color: "#FFFFFF" }}>{head}.</span>{" "}
                  <span style={{ color: "#A89F92" }}>{sub}.</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Success-fee explainer band */}
      <div
        style={{
          maxWidth: 1080,
          margin: "20px auto 0",
          padding: "20px 24px",
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 18,
          boxShadow: "0 1px 2px rgba(10,14,20,0.04)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: T.orangeTint,
            color: T.orange,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {Ic.bolt}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: FF.display,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              color: T.text,
            }}
          >
            {t("explainer.title")}
          </div>
          <div
            style={{
              fontSize: 13.5,
              color: T.textDim,
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            {t("explainer.body")}{" "}
            <span style={{ color: T.text, fontWeight: 500 }}>
              {t("explainer.math")}
            </span>
          </div>
        </div>
        <Btn variant="secondary" size="md" href="#pricing">
          {t("explainer.cta")} {Ic.arrowR}
        </Btn>
      </div>
      <div
        style={{
          textAlign: "center",
          marginTop: 36,
          fontSize: 13,
          color: T.textMute,
          letterSpacing: "-0.005em",
        }}
      >
        {t("fleet")}{" "}
        <a
          href={`mailto:${SALES_EMAIL}`}
          style={{
            color: T.text,
            fontWeight: 500,
            textDecoration: "underline",
          }}
        >
          {t("talkToSales")}
        </a>{" "}
        {t("fleetSuffix")}
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────
// FooterCTA
// ──────────────────────────────────────────────────────────────────────
export function FooterCTA() {
  const t = useTranslations("landing.footerCta")
  return (
    <section
      id="waitlist"
      style={{ padding: "96px 56px", background: T.bg, textAlign: "center" }}
    >
      <h2
        style={{
          fontFamily: FF.display,
          fontSize: 56,
          fontWeight: 600,
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
          margin: "0 0 18px",
          maxWidth: 760,
          marginInline: "auto",
        }}
      >
        {t("titleLead")}{" "}
        <span
          style={{
            fontFamily: FF.italic,
            fontStyle: "italic",
            fontWeight: 400,
            color: T.orange,
            letterSpacing: "-0.02em",
          }}
        >
          {t("titleItalic")}
        </span>
        {t("titleRest")}
      </h2>
      <p style={{ fontSize: 17, color: T.textDim, margin: "0 0 28px" }}>
        {t("subtitle")}
      </p>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <WaitlistForm />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <Btn variant="primary" size="lg" href={CHROME_STORE_URL}>
          {Ic.puzzle} {t("ctaPrimary")}
        </Btn>
        <Btn variant="secondary" size="lg" href={BOOK_CALL_URL}>
          {t("ctaSecondary")} {Ic.arrowR}
        </Btn>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Footer
// ──────────────────────────────────────────────────────────────────────
type FooterColumn = { title: string; links: string[] }

export function LandingFooter() {
  const t = useTranslations("landing.footer")
  const locale = useLocale()
  const columnKeys = ["product", "company", "resources", "legal"] as const

  return (
    <footer
      style={{
        padding: "40px 56px 28px",
        background: T.surfaceAlt,
        borderTop: `1px solid ${T.border}`,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr",
          gap: 40,
          marginBottom: 36,
        }}
      >
        <div>
          <Mark color={T.text} href={homeHref(locale)} />
          <p
            style={{
              fontSize: 13,
              color: T.textDim,
              lineHeight: 1.6,
              margin: "14px 0 0",
              maxWidth: 260,
            }}
          >
            {t("tagline")}
          </p>
        </div>
        {columnKeys.map((k) => {
          const col = t.raw(`columns.${k}`) as FooterColumn
          return (
            <div key={k}>
              <div
                style={{
                  fontFamily: FF.mono,
                  fontSize: 11,
                  color: T.textMute,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                {col.title}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {col.links.map((l) => {
                  const href = footerLinks[l] ?? "#"
                  const isExternal = /^https?:|^mailto:/.test(href)
                  return (
                    <li key={l} style={{ fontSize: 13.5 }}>
                      <a
                        href={href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        style={{
                          color: T.textDim,
                          textDecoration: "none",
                        }}
                      >
                        {l}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 22,
          borderTop: `1px solid ${T.border}`,
          fontFamily: FF.mono,
          fontSize: 11,
          color: T.textMute,
          letterSpacing: "0.06em",
        }}
      >
        <span>{t("copyright")}</span>
        <span>{t("compliance")}</span>
      </div>
    </footer>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Press strip + outlet quotes + YC backing band
// ──────────────────────────────────────────────────────────────────────
export function PressStrip() {
  const t = useTranslations("landing.extras.press")
  const outlets = t.raw("outlets") as string[]
  const quotes = t.raw("quotes") as Array<{ quote: string; source: string; date: string }>
  return (
    <section
      id="press"
      style={{
        padding: "64px 56px",
        background: T.bg,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div
          style={{
            fontFamily: FF.mono,
            fontSize: 11,
            color: T.textMute,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {t("eyebrow")}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
          flexWrap: "wrap",
          marginBottom: 56,
        }}
      >
        {outlets.map((p) => (
          <span
            key={p}
            style={{
              fontFamily: FF.display,
              fontSize: 22,
              fontWeight: 600,
              color: T.textDim,
              letterSpacing: "-0.02em",
              opacity: 0.7,
            }}
          >
            {p}
          </span>
        ))}
      </div>
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
        }}
      >
        {quotes.map((p) => (
          <Card key={p.source} padding={24}>
            <p
              style={{
                fontFamily: FF.display,
                fontSize: 15.5,
                lineHeight: 1.5,
                fontWeight: 500,
                color: T.text,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              &ldquo;{p.quote}&rdquo;
            </p>
            <div
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTop: `1px solid ${T.divider}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  fontFamily: FF.display,
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.orange,
                  letterSpacing: "-0.01em",
                }}
              >
                {p.source}
              </span>
              <span
                style={{
                  fontFamily: FF.mono,
                  fontSize: 11,
                  color: T.textMute,
                }}
              >
                {p.date}
              </span>
            </div>
          </Card>
        ))}
      </div>
      <div
        style={{
          maxWidth: 980,
          margin: "48px auto 0",
          padding: "20px 24px",
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 20,
          boxShadow: "0 1px 2px rgba(10,14,20,0.04)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: T.text,
            color: T.orange,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FF.display,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          YC
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: FF.display,
              fontSize: 16,
              fontWeight: 600,
              color: T.text,
              letterSpacing: "-0.015em",
            }}
          >
            {t("backingLead")}
          </div>
          <div style={{ fontSize: 13, color: T.textDim, marginTop: 2 }}>
            {t("backingSub")}
          </div>
        </div>
        <Btn variant="ghost" size="md" href="#waitlist">
          {t("readMore")} {Ic.arrowR}
        </Btn>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────
// 90-sec demo video — thumbnail mock with play button + chapters
// ──────────────────────────────────────────────────────────────────────
export function DemoVideo() {
  const t = useTranslations("landing.extras.demoVideo")
  const chapters = t.raw("chapters") as Array<[string, string]>
  return (
    <section
      id="demo"
      style={{
        padding: "96px 56px",
        background: T.surfaceAlt,
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 40px" }}>
        <div
          style={{
            fontFamily: FF.sans,
            fontSize: 12,
            fontWeight: 600,
            color: T.orange,
            letterSpacing: "-0.005em",
          }}
        >
          {t("eyebrow")}
        </div>
        <h2
          style={{
            fontFamily: FF.display,
            fontSize: 52,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            margin: "8px 0 14px",
            color: T.text,
          }}
        >
          {t("titleLead")}{" "}
          <span
            style={{
              fontFamily: FF.italic,
              fontStyle: "italic",
              fontWeight: 400,
              color: T.orange,
              letterSpacing: "-0.02em",
            }}
          >
            {t("titleItalic")}
          </span>{" "}
          {t("titleRest")}
        </h2>
        <p
          style={{
            fontSize: 17,
            color: T.textDim,
            margin: 0,
            lineHeight: 1.5,
            letterSpacing: "-0.005em",
          }}
        >
          {t("subtitle")}
        </p>
      </div>

      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          position: "relative",
          aspectRatio: "16/9",
          background: "#0A0E14",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow:
            "0 40px 80px -20px rgba(10,14,20,0.30), 0 4px 12px rgba(10,14,20,0.08)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(at 30% 30%, rgba(255,77,13,0.25) 0px, transparent 50%), radial-gradient(at 70% 70%, rgba(120,90,255,0.18) 0px, transparent 55%), radial-gradient(at 50% 100%, rgba(255,150,80,0.12) 0px, transparent 60%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.06,
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent 0 18px, rgba(255,255,255,0.4) 18px 19px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            aria-label={t("playLabel")}
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: T.orange,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "0 12px 40px rgba(214,58,5,0.40), 0 0 0 8px rgba(255,77,13,0.18)",
              transition: "transform 200ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            right: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 4,
              background: "rgba(255,255,255,0.18)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div style={{ width: "0%", height: "100%", background: T.orange }} />
          </div>
          <span
            style={{
              fontFamily: FF.mono,
              fontSize: 11,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {t("elapsed")}
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            padding: "4px 10px",
            background: "rgba(10,14,20,0.6)",
            backdropFilter: "blur(8px)",
            color: "#fff",
            borderRadius: 999,
            fontFamily: FF.mono,
            fontSize: 10.5,
            letterSpacing: "0.06em",
          }}
        >
          {t("badgeLeft")}
        </div>
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            padding: "4px 10px",
            background: "rgba(10,14,20,0.6)",
            backdropFilter: "blur(8px)",
            color: "#fff",
            borderRadius: 999,
            fontFamily: FF.mono,
            fontSize: 10.5,
            letterSpacing: "0.06em",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#FF4D0D",
            }}
          />
          {t("duration")}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 32,
          marginTop: 24,
          fontFamily: FF.mono,
          fontSize: 12,
          color: T.textDim,
          flexWrap: "wrap",
        }}
      >
        {chapters.map(([time, label]) => (
          <span
            key={time}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <span style={{ color: T.orange, fontWeight: 600 }}>{time}</span>
            <span>{label}</span>
          </span>
        ))}
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────
// ROI calculator — 4 sliders + live annual recovery
// ──────────────────────────────────────────────────────────────────────
export function ROICalculator() {
  return <ROIClient />
}


function ROIClient() {
  const t = useTranslations("landing.extras.roi")
  const [trucks, setTrucks] = useState(40)
  const [detentionHrs, setDetentionHrs] = useState(6)
  const [rate, setRate] = useState(75)
  const [eventsPerTruck, setEventsPerTruck] = useState(2.4)

  const claimAmount = detentionHrs * rate
  const monthly = trucks * eventsPerTruck * claimAmount * 0.94
  const annual = monthly * 12
  const ourFee = annual * 0.18
  const netToYou = annual - ourFee

  return (
    <section id="roi" style={{ padding: "96px 56px", background: T.bg }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.05fr",
          gap: 56,
          alignItems: "center",
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: FF.sans,
              fontSize: 12,
              fontWeight: 600,
              color: T.orange,
              letterSpacing: "-0.005em",
            }}
          >
            {t("eyebrow")}
          </div>
          <h2
            style={{
              fontFamily: FF.display,
              fontSize: 56,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              margin: "8px 0 22px",
              color: T.text,
            }}
          >
            {t("titleLead")}
            <br />
            <span
              style={{
                fontFamily: FF.italic,
                fontStyle: "italic",
                fontWeight: 400,
                color: T.orange,
                letterSpacing: "-0.02em",
              }}
            >
              {t("titleItalic")}
            </span>{" "}
            {t("titleRest")}
          </h2>
          <p
            style={{
              fontSize: 17,
              color: T.textDim,
              margin: 0,
              lineHeight: 1.5,
              letterSpacing: "-0.005em",
              maxWidth: 480,
            }}
          >
            {t("subtitle")}
          </p>

          <div
            style={{
              marginTop: 36,
              padding: "24px 28px",
              background: T.orangeTint,
              border: `1px solid ${T.borderStrong}`,
              borderRadius: 16,
            }}
          >
            <div
              style={{
                fontFamily: FF.mono,
                fontSize: 10.5,
                color: T.orangeDeep,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {t("estLabel")}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
              <span
                style={{
                  fontFamily: FF.display,
                  fontSize: 56,
                  fontWeight: 600,
                  color: T.text,
                  letterSpacing: "-0.035em",
                  lineHeight: 1,
                }}
              >
                ${Math.round(annual).toLocaleString()}
              </span>
            </div>
            <div
              style={{
                marginTop: 18,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                paddingTop: 16,
                borderTop: `1px solid ${T.borderStrong}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: FF.mono,
                    fontSize: 10.5,
                    color: T.textMute,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {t("youKeep")}
                </div>
                <div
                  style={{
                    fontFamily: FF.display,
                    fontSize: 22,
                    fontWeight: 600,
                    color: T.success,
                    marginTop: 4,
                  }}
                >
                  ${Math.round(netToYou).toLocaleString()}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: FF.mono,
                    fontSize: 10.5,
                    color: T.textMute,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {t("ourFee")}
                </div>
                <div
                  style={{
                    fontFamily: FF.display,
                    fontSize: 22,
                    fontWeight: 600,
                    color: T.textDim,
                    marginTop: 4,
                  }}
                >
                  ${Math.round(ourFee).toLocaleString()}
                </div>
              </div>
            </div>
            <Btn
              variant="accent"
              size="lg"
              href="#waitlist"
              style={{ width: "100%", marginTop: 20, justifyContent: "center" }}
            >
              {t("cta")}
            </Btn>
          </div>
        </div>

        <Card padding={32}>
          <SectionHead eyebrow={t("inputsEyebrow")} title={t("inputsTitle")} />
          <ROISlider
            label={t("lblTrucks")}
            value={trucks}
            set={setTrucks}
            min={1}
            max={500}
            fmt={(v) => String(v)}
          />
          <ROISlider
            label={t("lblHours")}
            value={detentionHrs}
            set={setDetentionHrs}
            min={1}
            max={12}
            fmt={(v) => `${v}h`}
          />
          <ROISlider
            label={t("lblRate")}
            value={rate}
            set={setRate}
            min={25}
            max={150}
            fmt={(v) => `$${v}/h`}
          />
          <ROISlider
            label={t("lblEvents")}
            value={eventsPerTruck}
            set={setEventsPerTruck}
            min={0.5}
            max={6}
            step={0.1}
            fmt={(v) => v.toFixed(1)}
          />
          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: `1px solid ${T.divider}`,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            {[
              [t("perClaim"), `$${claimAmount.toLocaleString()}`],
              [t("perMonth"), `$${Math.round(monthly).toLocaleString()}`],
              [t("perTruck"), `$${Math.round(monthly / trucks).toLocaleString()}`],
            ].map(([k, v]) => (
              <div key={k}>
                <div
                  style={{
                    fontFamily: FF.mono,
                    fontSize: 10,
                    color: T.textMute,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {k}
                </div>
                <div
                  style={{
                    fontFamily: FF.display,
                    fontSize: 22,
                    fontWeight: 600,
                    color: T.text,
                    marginTop: 4,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}

function ROISlider({
  label,
  value,
  set,
  min,
  max,
  step = 1,
  fmt,
}: {
  label: string
  value: number
  set: (v: number) => void
  min: number
  max: number
  step?: number
  fmt: (v: number) => string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 13.5, color: T.textDim, fontWeight: 500 }}>
          {label}
        </span>
        <span
          style={{
            fontFamily: FF.mono,
            fontSize: 15,
            color: T.text,
            fontWeight: 600,
          }}
        >
          {fmt(value)}
        </span>
      </div>
      <div
        style={{
          position: "relative",
          height: 6,
          background: T.surfaceElev,
          borderRadius: 3,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            background: T.orange,
            borderRadius: 3,
            transition: "width 120ms linear",
          }}
        />
        <input
          type="range"
          aria-label={label}
          value={value}
          onChange={(e) => set(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            opacity: 0,
            cursor: "pointer",
            margin: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `calc(${pct}% - 10px)`,
            top: -7,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: T.surface,
            border: `2px solid ${T.orange}`,
            boxShadow: "0 1px 3px rgba(10,14,20,0.15)",
            pointerEvents: "none",
            transition: "left 120ms linear",
          }}
        />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Comparison table — VettGuard vs alternatives
// ──────────────────────────────────────────────────────────────────────
export function Comparison() {
  const t = useTranslations("landing.extras.comparison")
  const cols = t.raw("cols") as string[]
  const rows = t.raw("rows") as string[][]
  const partialLabel = t("partialLabel")

  const renderCell = (value: string, isPrimary: boolean) => {
    if (value === "yes")
      return (
        <span
          style={{
            display: "inline-flex",
            width: 24,
            height: 24,
            borderRadius: 999,
            background: isPrimary ? T.orange : T.successSoft,
            color: isPrimary ? "#fff" : T.success,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {Ic.check}
        </span>
      )
    if (value === "no")
      return (
        <span
          style={{
            display: "inline-flex",
            width: 24,
            height: 24,
            borderRadius: 999,
            background: T.surfaceElev,
            color: T.textMute,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {Ic.x}
        </span>
      )
    if (value === "partial")
      return (
        <span
          style={{
            fontFamily: FF.mono,
            fontSize: 11,
            color: T.warn,
            fontWeight: 600,
          }}
        >
          {partialLabel}
        </span>
      )
    return (
      <span
        style={{
          fontFamily: FF.mono,
          fontSize: 12.5,
          color: isPrimary ? T.text : T.textDim,
          fontWeight: isPrimary ? 600 : 500,
        }}
      >
        {value}
      </span>
    )
  }

  return (
    <section
      id="comparison"
      style={{
        padding: "96px 56px",
        background: T.surfaceAlt,
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
        <div
          style={{
            fontFamily: FF.sans,
            fontSize: 12,
            fontWeight: 600,
            color: T.orange,
            letterSpacing: "-0.005em",
          }}
        >
          {t("eyebrow")}
        </div>
        <h2
          style={{
            fontFamily: FF.display,
            fontSize: 52,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            margin: "8px 0 14px",
            color: T.text,
          }}
        >
          {t("titleLead")}{" "}
          <span
            style={{
              fontFamily: FF.italic,
              fontStyle: "italic",
              fontWeight: 400,
              color: T.orange,
              letterSpacing: "-0.02em",
            }}
          >
            {t("titleItalic")}
          </span>{" "}
          {t("titleRest")}
        </h2>
        <p
          style={{
            fontSize: 17,
            color: T.textDim,
            margin: 0,
            lineHeight: 1.5,
            letterSpacing: "-0.005em",
          }}
        >
          {t("subtitle")}
        </p>
      </div>

      <Card padding={0} style={{ maxWidth: 1200, margin: "0 auto", overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr repeat(4, 1fr)",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div style={{ padding: "20px 24px" }} />
          {cols.map((c, i) => (
            <div
              key={c}
              style={{
                padding: "20px 16px",
                textAlign: "center",
                background: i === 0 ? T.orangeTint : "transparent",
                borderLeft: i === 0 ? `1px solid ${T.borderStrong}` : "none",
                borderRight: i === 0 ? `1px solid ${T.borderStrong}` : "none",
              }}
            >
              {i === 0 && (
                <Pill tone="primary" style={{ marginBottom: 8 }}>
                  {t("recommended")}
                </Pill>
              )}
              <div
                style={{
                  fontFamily: FF.display,
                  fontSize: 18,
                  fontWeight: 600,
                  color: T.text,
                  letterSpacing: "-0.02em",
                }}
              >
                {c}
              </div>
            </div>
          ))}
        </div>
        {rows.map((r, i) => (
          <div
            key={r[0]}
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr repeat(4, 1fr)",
              borderBottom: i < rows.length - 1 ? `1px solid ${T.divider}` : "none",
              background: i % 2 ? T.surfaceAlt : "transparent",
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                fontSize: 14,
                color: T.text,
                fontWeight: 500,
              }}
            >
              {r[0]}
            </div>
            {r.slice(1).map((cell, j) => (
              <div
                key={j}
                style={{
                  padding: "14px 16px",
                  textAlign: "center",
                  background: j === 0 ? T.orangeTint : "transparent",
                  borderLeft: j === 0 ? `1px solid ${T.borderStrong}` : "none",
                  borderRight: j === 0 ? `1px solid ${T.borderStrong}` : "none",
                }}
              >
                {renderCell(cell, j === 0)}
              </div>
            ))}
          </div>
        ))}
      </Card>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Testimonials — 3 carrier quotes
// ──────────────────────────────────────────────────────────────────────
export function Testimonials() {
  const t = useTranslations("landing.extras.testimonials")
  const items = t.raw("items") as Array<{
    q: string
    name: string
    role: string
    fleet: string
    stat: string
    statLbl: string
  }>
  return (
    <section
      id="testimonials"
      style={{
        padding: "96px 56px",
        background: T.surfaceAlt,
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
        <div
          style={{
            fontFamily: FF.sans,
            fontSize: 12,
            fontWeight: 600,
            color: T.orange,
            letterSpacing: "-0.005em",
          }}
        >
          {t("eyebrow")}
        </div>
        <h2
          style={{
            fontFamily: FF.display,
            fontSize: 52,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            margin: "8px 0 14px",
            color: T.text,
          }}
        >
          {t("titleLead")}{" "}
          <span
            style={{
              fontFamily: FF.italic,
              fontStyle: "italic",
              fontWeight: 400,
              color: T.orange,
              letterSpacing: "-0.02em",
            }}
          >
            {t("titleItalic")}
          </span>
          {t("titleRest")}
        </h2>
        <p
          style={{
            fontSize: 17,
            color: T.textDim,
            margin: 0,
            lineHeight: 1.5,
            letterSpacing: "-0.005em",
          }}
        >
          {t("subtitle")}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        {items.map((q) => (
          <Card
            key={q.name}
            padding={32}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              minHeight: 360,
            }}
          >
            <div
              style={{
                fontFamily: FF.italic,
                fontSize: 56,
                fontWeight: 400,
                color: T.orange,
                lineHeight: 0.4,
                letterSpacing: "-0.04em",
              }}
            >
              &ldquo;
            </div>
            <blockquote
              style={{
                fontFamily: FF.display,
                fontSize: 19,
                lineHeight: 1.35,
                fontWeight: 500,
                color: T.text,
                margin: 0,
                letterSpacing: "-0.01em",
                flex: 1,
              }}
            >
              {q.q}
            </blockquote>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                paddingTop: 20,
                borderTop: `1px solid ${T.divider}`,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#F4D6C2",
                  color: T.text,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FF.sans,
                  fontWeight: 600,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {q.name
                  .split(" ")
                  .map((x) => x[0])
                  .join("")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: T.text,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {q.name}
                </div>
                <div
                  style={{
                    fontFamily: FF.mono,
                    fontSize: 10.5,
                    color: T.textMute,
                    marginTop: 2,
                  }}
                >
                  {q.role}
                </div>
                <div
                  style={{
                    fontFamily: FF.mono,
                    fontSize: 10.5,
                    color: T.textMute,
                  }}
                >
                  {q.fleet}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontFamily: FF.display,
                    fontSize: 22,
                    fontWeight: 600,
                    color: T.orange,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {q.stat}
                </div>
                <div
                  style={{
                    fontFamily: FF.mono,
                    fontSize: 10,
                    color: T.textMute,
                    marginTop: 4,
                  }}
                >
                  {q.statLbl}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────
// FAQ desktop — 8 items, sticky left column
// ──────────────────────────────────────────────────────────────────────
export function FAQDesktop() {
  const t = useTranslations("landing.extras.faqDesktop")
  const items = t.raw("items") as Array<{ q: string; a: string }>
  const [open, setOpen] = useState(0)
  return (
    <section
      id="faq"
      style={{
        padding: "96px 56px",
        background: T.bg,
        scrollMarginTop: 80,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.85fr 1.15fr",
          gap: 64,
          alignItems: "flex-start",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div style={{ position: "sticky", top: 100 }}>
          <div
            style={{
              fontFamily: FF.sans,
              fontSize: 12,
              fontWeight: 600,
              color: T.orange,
              letterSpacing: "-0.005em",
            }}
          >
            {t("eyebrow")}
          </div>
          <h2
            style={{
              fontFamily: FF.display,
              fontSize: 48,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              margin: "8px 0 18px",
              color: T.text,
            }}
          >
            {t("title")}
          </h2>
          <p
            style={{
              fontSize: 16,
              color: T.textDim,
              margin: 0,
              lineHeight: 1.5,
              letterSpacing: "-0.005em",
            }}
          >
            {t("subtitle")}
          </p>
          <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
            <Btn variant="secondary" size="md" href={`mailto:${SALES_EMAIL}`}>
              {t("emailUs")}
            </Btn>
            <Btn variant="ghost" size="md" href={BOOK_CALL_URL}>
              {t("bookCall")} {Ic.arrowR}
            </Btn>
          </div>
        </div>

        <div>
          {items.map((it, i) => {
            const isOpen = open === i
            return (
              <div
                key={it.q}
                style={{
                  borderTop: i === 0 ? `1px solid ${T.border}` : "none",
                  borderBottom: `1px solid ${T.border}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "22px 0",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 24,
                    fontFamily: FF.sans,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FF.display,
                      fontSize: 19,
                      fontWeight: 600,
                      color: T.text,
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {it.q}
                  </span>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: isOpen ? T.orange : T.surfaceElev,
                      color: isOpen ? "#fff" : T.textDim,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      transition:
                        "transform 240ms cubic-bezier(0.22,1,0.36,1), background 200ms ease, color 200ms ease",
                    }}
                  >
                    {Ic.plus}
                  </span>
                </button>
                <div className={`vg-collapse ${isOpen ? "is-open" : ""}`}>
                  <div>
                    <div
                      style={{
                        paddingBottom: 22,
                        paddingRight: 56,
                        fontFamily: FF.sans,
                        fontSize: 15,
                        lineHeight: 1.6,
                        color: T.textDim,
                        letterSpacing: "-0.005em",
                      }}
                    >
                      {it.a}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
