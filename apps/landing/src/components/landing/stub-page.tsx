// Shared shell for the 15 static info pages (legal/company/resources/product
// columns + status). Phase 4 ops swaps the placeholder body for real docs
// fetched from a CMS — this scaffold gets us linkable pages immediately so
// the footer doesn't 404 and crawlers see canonical hreflang URLs.

import type { ReactNode } from "react"
import type { Locale } from "@vettguard/i18n/config"

import { FF, T } from "./dsl"
import { Hero, LandingNav } from "./hero"
import { LandingFooter } from "./sections"

export function StubPage({
  locale,
  eyebrow,
  title,
  intro,
  body,
  lastUpdated,
}: {
  locale: Locale
  eyebrow: string
  title: string
  intro?: string
  body?: ReactNode
  lastUpdated?: string
}) {
  return (
    <div style={{ background: T.bg, color: T.text, minHeight: "100vh" }}>
      <LandingNav locale={locale} />

      <section
        style={{
          padding: "96px 56px 56px",
          background: T.bg,
          maxWidth: 880,
          marginInline: "auto",
        }}
      >
        <div
          style={{
            fontFamily: FF.sans,
            fontSize: 12,
            fontWeight: 600,
            color: T.orange,
            letterSpacing: "-0.005em",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
        <h1
          style={{
            fontFamily: FF.display,
            fontSize: 56,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            margin: "10px 0 18px",
            color: T.text,
          }}
        >
          {title}
        </h1>
        {intro && (
          <p
            style={{
              fontSize: 19,
              lineHeight: 1.5,
              color: T.textDim,
              letterSpacing: "-0.005em",
              margin: "0 0 8px",
              maxWidth: 720,
            }}
          >
            {intro}
          </p>
        )}
        {lastUpdated && (
          <div
            style={{
              fontFamily: FF.mono,
              fontSize: 11,
              color: T.textMute,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginTop: 12,
            }}
          >
            Last updated · {lastUpdated}
          </div>
        )}
      </section>

      <section
        style={{
          padding: "16px 56px 96px",
          background: T.bg,
          maxWidth: 880,
          marginInline: "auto",
        }}
      >
        {body ?? (
          <div
            style={{
              padding: "20px 24px",
              background: T.orangeTint,
              border: "1px solid #FFC9AB",
              borderRadius: 12,
              color: T.text,
              fontSize: 14.5,
              lineHeight: 1.55,
            }}
          >
            <strong>Coming soon.</strong> The full document lands in Phase 4 of
            our launch plan. In the meantime,{" "}
            <a
              href="mailto:support@vettguard.com"
              style={{ color: T.orangeDeep, fontWeight: 500 }}
            >
              email support@vettguard.com
            </a>{" "}
            for questions and we&apos;ll send you what you need.
          </div>
        )}
      </section>

      <LandingFooter />
    </div>
  )
}

// Convenience for legal pages, which all share the same "this is a stub"
// disclaimer text and need a consistent eyebrow.
export function LegalStub({
  locale,
  title,
  intro,
  lastUpdated = "2026-05-16",
}: {
  locale: Locale
  title: string
  intro?: string
  lastUpdated?: string
}) {
  return (
    <StubPage
      locale={locale}
      eyebrow="Legal"
      title={title}
      intro={intro}
      lastUpdated={lastUpdated}
    />
  )
}

export { Hero }
