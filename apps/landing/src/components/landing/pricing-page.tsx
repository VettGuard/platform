"use client"

// Pricing page — port of docs/design/reference/project/brand-extras.jsx PricingPage.
// Composes the existing LandingNav + LandingFooter shells with a hero,
// two tier cards, and a grouped feature-comparison table.

import { useTranslations } from "next-intl"

import type { Locale } from "@vettguard/i18n/config"
import { Btn, Card, FF, Ic, Pill, T } from "./dsl"
import { LandingNav } from "./hero"
import { LandingFooter } from "./sections"
import { CHROME_STORE_URL } from "./links"

type Feature =
  | { section: string }
  | { name: string; free: string | boolean; pro: string | boolean }

const isSection = (f: Feature): f is { section: string } => "section" in f

export function PricingPageView({ locale }: { locale: Locale }) {
  const t = useTranslations("landing.pricingPage")
  const features = t.raw("features") as Feature[]
  const sectionLabels = t.raw("sections") as Record<string, string>

  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: FF.sans }}>
      <LandingNav locale={locale} />

      <section
        style={{
          padding: "72px 56px 64px",
          textAlign: "center",
          backgroundImage: T.gradient,
          backgroundColor: T.bg,
        }}
      >
        <Pill
          tone="ai"
          style={{ marginBottom: 22 }}
          className="vg-enter vg-enter-1"
        >
          <span style={{ color: T.orange, display: "flex" }}>{Ic.sparkle}</span>
          {t("hero.pill")}
        </Pill>
        <h1
          className="vg-enter vg-enter-2"
          style={{
            fontFamily: FF.display,
            fontSize: 68,
            fontWeight: 600,
            lineHeight: 1.02,
            letterSpacing: "-0.04em",
            margin: "0 0 22px",
            color: T.text,
          }}
        >
          {t("hero.titleLead")}
          <br />
          {t("hero.titleBreak")}{" "}
          <span
            style={{
              fontFamily: FF.italic,
              fontStyle: "italic",
              fontWeight: 400,
              color: T.orange,
              letterSpacing: "-0.02em",
            }}
          >
            {t("hero.titleItalic")}
          </span>
          {t("hero.titleRest")}
        </h1>
        <p
          className="vg-enter vg-enter-3"
          style={{
            fontSize: 19,
            lineHeight: 1.5,
            color: T.textDim,
            maxWidth: 640,
            margin: "0 auto",
            letterSpacing: "-0.005em",
          }}
        >
          {t("hero.subtitle")}
        </p>
      </section>

      <section style={{ padding: "0 56px 64px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
            maxWidth: 1080,
            margin: "0 auto",
          }}
        >
          <Card padding={36} style={{ borderRadius: 16 }}>
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
            <div style={{ fontSize: 14, color: T.textDim, marginBottom: 22 }}>
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
              <span style={{ fontSize: 14, color: T.textDim }}>
                {t("free.per")}
              </span>
            </div>
            <div
              style={{
                fontFamily: FF.mono,
                fontSize: 12,
                color: T.textDim,
                marginBottom: 22,
              }}
            >
              {t("free.plus18")}
            </div>
            <Btn
              variant="primary"
              size="md"
              href={CHROME_STORE_URL}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {t("free.cta")}
            </Btn>
          </Card>

          <div
            style={{
              background: "#0A0E14",
              color: "#F2EFE9",
              border: "1px solid #0A0E14",
              borderRadius: 16,
              padding: 36,
              boxShadow: "0 20px 40px -8px rgba(10,14,20,0.25)",
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
                  color: "#fff",
                }}
              >
                {t("pro.name")}
              </div>
              <Pill
                style={{ background: T.orange, color: "#fff", border: "none" }}
              >
                {t("pro.badge")}
              </Pill>
            </div>
            <div style={{ fontSize: 14, color: "#A89F92", marginBottom: 22 }}>
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
                  color: "#fff",
                  lineHeight: 1,
                }}
              >
                {t("pro.price")}
              </span>
              <span style={{ fontSize: 14, color: "#A89F92" }}>
                {t("pro.per")}
              </span>
            </div>
            <div
              style={{
                fontFamily: FF.mono,
                fontSize: 12,
                color: "#A89F92",
                marginBottom: 22,
              }}
            >
              {t("pro.plus18")}
            </div>
            <Btn
              variant="accent"
              size="md"
              href="#waitlist"
              style={{ width: "100%", justifyContent: "center" }}
            >
              {t("pro.cta")}
            </Btn>
          </div>
        </div>
      </section>

      <section style={{ padding: "32px 56px 96px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h2
            style={{
              fontFamily: FF.display,
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              color: T.text,
              margin: 0,
            }}
          >
            {t("compare.title")}
          </h2>
        </div>
        <Card
          padding={0}
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            overflow: "hidden",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.8fr 1fr 1fr",
              borderBottom: `1px solid ${T.border}`,
              padding: "20px 24px",
              alignItems: "center",
            }}
          >
            <div />
            <div
              style={{
                textAlign: "center",
                fontFamily: FF.display,
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              {t("free.name")}
            </div>
            <div
              style={{
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Pill tone="primary">{t("pro.name")}</Pill>
              <span
                style={{
                  fontFamily: FF.mono,
                  fontSize: 11,
                  color: T.textMute,
                }}
              >
                {t("compare.proSub")}
              </span>
            </div>
          </div>
          {features.map((f, i) =>
            isSection(f) ? (
              <div
                key={`sec-${i}`}
                style={{
                  padding: "16px 24px 8px",
                  background: T.surfaceAlt,
                  fontFamily: FF.mono,
                  fontSize: 11,
                  color: T.textMute,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                {sectionLabels[f.section] ?? f.section}
              </div>
            ) : (
              <div
                key={f.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.8fr 1fr 1fr",
                  padding: "12px 24px",
                  alignItems: "center",
                  borderTop: `1px solid ${T.divider}`,
                }}
              >
                <div style={{ fontSize: 13.5, color: T.text }}>{f.name}</div>
                <div style={{ textAlign: "center" }}>
                  <ValueCell value={f.free} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <ValueCell value={f.pro} primary />
                </div>
              </div>
            ),
          )}
        </Card>
      </section>

      <LandingFooter />
    </div>
  )
}

function ValueCell({
  value,
  primary = false,
}: {
  value: string | boolean
  primary?: boolean
}) {
  if (value === true)
    return (
      <span
        style={{
          display: "inline-flex",
          width: 22,
          height: 22,
          borderRadius: 999,
          background: primary ? T.orange : T.successSoft,
          color: primary ? "#fff" : T.success,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {Ic.check}
      </span>
    )
  if (value === false)
    return (
      <span
        style={{
          display: "inline-flex",
          width: 22,
          height: 22,
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
  return (
    <span
      style={{
        fontFamily: FF.mono,
        fontSize: 12,
        color: primary ? T.orangeDeep : T.textDim,
        fontWeight: 500,
      }}
    >
      {value}
    </span>
  )
}
