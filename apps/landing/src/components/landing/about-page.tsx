"use client"

// About page — port of docs/design/reference/project/brand-extras.jsx AboutPage.
// Hero + stats strip + founders + principles + backers.

import { useTranslations } from "next-intl"

import type { Locale } from "@vettguard/i18n/config"
import { Avatar, Card, FF, Ic, Pill, SectionHead, T } from "./dsl"
import { LandingNav } from "./hero"
import { LandingFooter } from "./sections"

type IconKey = "shield" | "bolt" | "dollar" | "sparkle"
const iconMap: Record<IconKey, React.ReactNode> = {
  shield: Ic.shield,
  bolt: Ic.bolt,
  dollar: Ic.dollar,
  sparkle: Ic.sparkle,
}

export function AboutPageView({ locale }: { locale: Locale }) {
  const t = useTranslations("landing.aboutPage")
  const stats = t.raw("stats") as Array<[string, string]>
  const founders = t.raw("founders") as Array<{
    name: string
    role: string
    bio: string
    initials: string
    color: string
  }>
  const principles = t.raw("principles") as Array<{
    icon: IconKey
    t: string
    d: string
  }>
  const backedItems = t.raw("backed.items") as string[]

  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: FF.sans }}>
      <LandingNav locale={locale} />

      <section
        style={{
          padding: "72px 56px 56px",
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
            fontSize: 64,
            fontWeight: 600,
            lineHeight: 1.04,
            letterSpacing: "-0.04em",
            margin: "0 auto 22px",
            maxWidth: 880,
            color: T.text,
          }}
        >
          {t("hero.titleLead")}
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
            {t("hero.titleItalic")}
          </span>{" "}
          {t("hero.titleRest")}
        </h1>
        <p
          className="vg-enter vg-enter-3"
          style={{
            fontSize: 18,
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

      <section
        style={{
          padding: "40px 56px",
          borderTop: `1px solid ${T.border}`,
          borderBottom: `1px solid ${T.border}`,
          background: T.surfaceAlt,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
            maxWidth: 1080,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          {stats.map(([v, l]) => (
            <div key={l}>
              <div
                style={{
                  fontFamily: FF.display,
                  fontSize: 44,
                  fontWeight: 600,
                  letterSpacing: "-0.035em",
                  color: T.orange,
                }}
              >
                {v}
              </div>
              <div style={{ fontSize: 13, color: T.textDim, marginTop: 4 }}>
                {l}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "96px 56px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <SectionHead eyebrow={t("team.eyebrow")} title={t("team.title")} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginTop: 32,
            }}
          >
            {founders.map((f) => (
              <Card
                key={f.name}
                padding={28}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <Avatar initials={f.initials} size={72} color={f.color} />
                <div>
                  <div
                    style={{
                      fontFamily: FF.display,
                      fontSize: 20,
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      color: T.text,
                    }}
                  >
                    {f.name}
                  </div>
                  <div
                    style={{
                      fontFamily: FF.mono,
                      fontSize: 11.5,
                      color: T.orange,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      marginTop: 3,
                      fontWeight: 600,
                    }}
                  >
                    {f.role}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: T.textDim,
                    lineHeight: 1.5,
                  }}
                >
                  {f.bio}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 56px 96px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <SectionHead eyebrow={t("values.eyebrow")} title={t("values.title")} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
              marginTop: 32,
            }}
          >
            {principles.map((v) => (
              <Card
                key={v.t}
                padding={32}
                style={{ display: "flex", gap: 18, alignItems: "flex-start" }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: T.orangeTint,
                    color: T.orangeDeep,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {iconMap[v.icon]}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: FF.display,
                      fontSize: 19,
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      color: T.text,
                    }}
                  >
                    {v.t}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: T.textDim,
                      lineHeight: 1.5,
                      marginTop: 6,
                    }}
                  >
                    {v.d}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "64px 56px",
          borderTop: `1px solid ${T.border}`,
          background: T.surfaceAlt,
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              fontFamily: FF.mono,
              fontSize: 11,
              color: T.textMute,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 22,
            }}
          >
            {t("backed.eyebrow")}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 48,
              flexWrap: "wrap",
            }}
          >
            {backedItems.map((b) => (
              <span
                key={b}
                style={{
                  fontFamily: FF.display,
                  fontSize: 22,
                  fontWeight: 600,
                  color: T.textDim,
                  letterSpacing: "-0.02em",
                  opacity: 0.7,
                }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
