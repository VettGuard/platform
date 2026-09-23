"use client"

// Mobile landing — port of docs/design/reference/project/mobile-landing.jsx.
// Renders under 768px via .vg-mobile-only CSS swap in globals.css. All copy
// flows through @vettguard/i18n under the "mobile.*" namespace.

import { useLocale, useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { Avatar, Btn, FF, Ic, Mark, Pill, T, homeHref, waitlistHref } from "./dsl"
import { CHROME_STORE_URL, SIGN_IN_URL } from "./links"
import { LocaleSwitcher } from "./locale-switcher"
import { ThemeToggle } from "./theme-toggle"
import type { Locale } from "@vettguard/i18n/config"

export function MobileLanding() {
  const [recovered, setRecovered] = useState(2_846_290)
  useEffect(() => {
    const id = setInterval(
      () => setRecovered((v) => v + Math.floor(40 + Math.random() * 180)),
      1500,
    )
    return () => clearInterval(id)
  }, [])

  return (
    <div
      style={{
        background: T.bg,
        color: T.text,
        fontFamily: FF.sans,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <MobileNav />
      <MobileHero recovered={recovered} />
      <MobileSocialProof />
      <MobileExtension />
      <MobilePricing />
      <MobileTestimonial />
      <MobileFAQ />
      <MobileCTA />
      <MobileFooter />
    </div>
  )
}

function MobileNav() {
  const nav = useTranslations("landing.nav")
  const m = useTranslations("landing.mobile")
  const locale = useLocale()
  const [open, setOpen] = useState(false)

  // Body scroll lock + ESC to close.
  useEffect(() => {
    if (!open) return
    document.body.classList.add("vg-no-scroll")
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.classList.remove("vg-no-scroll")
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  const blogHref = locale === "en" ? "/blog" : `/${locale}/blog`
  // Only sections that actually exist on the mobile composition. The
  // desktop nav's `howItWorks` / `carriers` anchors don't have mobile
  // counterparts yet.
  const links: Array<[string, string]> = [
    [nav("extension"), "#extension"],
    [nav("pricing"), "#pricing"],
    [m("faqLabel"), "#faq"],
    [nav("blog"), blogHref],
  ]

  return (
    <>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          background: T.glass,
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom: `1px solid ${T.border}`,
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <Mark color={T.text} size={22} href={homeHref(locale)} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Btn
            variant="ghost"
            size="sm"
            href={SIGN_IN_URL}
            style={{ height: 32, padding: "0 10px" }}
          >
            {nav("signIn")}
          </Btn>
          <button
            type="button"
            aria-label={m("menu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: open ? T.surfaceElev : "transparent",
              border: `1px solid ${T.border}`,
              color: T.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 180ms ease",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                transform: open ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 220ms cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              {open ? (
                <path d="M6 6l12 12M18 6 6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      <div
        className={`vg-drawer-backdrop ${open ? "is-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        className={`vg-drawer-panel ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={m("menu")}
      >
        <MobileDrawerBody
          locale={locale as Locale}
          links={links}
          onNavigate={() => setOpen(false)}
        />
      </div>
    </>
  )
}

function MobileDrawerBody({
  locale,
  links,
  onNavigate,
}: {
  locale: Locale
  links: Array<[string, string]>
  onNavigate: () => void
}) {
  const nav = useTranslations("landing.nav")
  const m = useTranslations("landing.mobile")
  return (
    <div
      style={{
        background: T.bg,
        borderBottom: `1px solid ${T.border}`,
        boxShadow: "0 24px 48px -16px rgba(10,14,20,0.18)",
        padding: "12px 18px 22px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 10,
          marginBottom: 6,
        }}
      >
        <Mark color={T.text} size={22} href={homeHref(locale)} />
        <button
          type="button"
          aria-label={m("close")}
          onClick={onNavigate}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: T.surfaceElev,
            border: `1px solid ${T.border}`,
            color: T.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 180ms ease",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "0 0 16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {links.map(([label, href]) => (
          <li key={label}>
            <a
              href={href}
              onClick={(e) => {
                // Hash links: the body scroll-lock blocks the browser's
                // anchor scroll while the drawer is open. Intercept,
                // close the drawer (which lifts the lock), then scroll
                // ourselves on the next frame.
                if (href.startsWith("#")) {
                  e.preventDefault()
                  const id = href.slice(1)
                  onNavigate()
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      // Desktop and mobile compositions both render with
                      // the same section IDs; getElementById picks the
                      // desktop one (display:none). Pick the rendered one
                      // via offsetParent.
                      const matches = document.querySelectorAll<HTMLElement>(
                        `[id="${CSS.escape(id)}"]`,
                      )
                      const el = Array.from(matches).find(
                        (n) => n.offsetParent !== null,
                      )
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" })
                        history.replaceState(null, "", href)
                      }
                    })
                  })
                } else {
                  onNavigate()
                }
              }}
              style={{
                display: "block",
                padding: "14px 6px",
                fontFamily: FF.display,
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: T.text,
                borderBottom: `1px solid ${T.divider}`,
                textDecoration: "none",
              }}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Btn
          variant="accent"
          size="lg"
          href={waitlistHref(locale)}
          style={{
            width: "100%",
            justifyContent: "center",
            boxShadow:
              "0 1px 2px rgba(214,58,5,0.22), 0 4px 14px -2px rgba(214,58,5,0.30), inset 0 1px 0 rgba(255,255,255,0.22)",
          }}
        >
          {Ic.sparkle} {nav("joinWaitlist")}
        </Btn>
        <Btn
          variant="secondary"
          size="lg"
          href={SIGN_IN_URL}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {nav("signIn")}
        </Btn>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 16,
          paddingTop: 14,
          borderTop: `1px solid ${T.divider}`,
        }}
      >
        <LocaleSwitcher current={locale} align="left" />
        <ThemeToggle label={nav("toggleTheme")} />
      </div>
    </div>
  )
}

function MobileHero({ recovered }: { recovered: number }) {
  const t = useTranslations("landing.mobile.hero")
  return (
    <section
      style={{
        padding: "32px 20px 36px",
        backgroundImage: T.gradient,
        backgroundColor: T.bg,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Pill tone="ai" style={{ marginBottom: 18 }} className="vg-enter vg-enter-1">
        <span style={{ color: T.orange, display: "flex" }}>{Ic.sparkle}</span>
        {t("pill")}
      </Pill>

      <h1
        className="vg-enter vg-enter-2"
        style={{
          fontFamily: FF.display,
          fontWeight: 600,
          fontSize: 38,
          lineHeight: 1.04,
          letterSpacing: "-0.035em",
          margin: "0 0 16px",
          color: T.text,
        }}
      >
        {t("headlineLead")}
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
          {t("headlineItalic")}
        </span>{" "}
        {t("headlineRest")}
      </h1>

      <p
        className="vg-enter vg-enter-3"
        style={{
          fontSize: 15,
          lineHeight: 1.5,
          color: T.textDim,
          margin: "0 0 22px",
          letterSpacing: "-0.005em",
        }}
      >
        {t("subtitle")}
      </p>

      <div
        className="vg-enter vg-enter-4"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 22,
        }}
      >
        <Btn
          variant="accent"
          size="lg"
          href="#waitlist"
          style={{
            width: "100%",
            justifyContent: "center",
            boxShadow:
              "0 1px 2px rgba(214,58,5,0.22), 0 4px 14px -2px rgba(214,58,5,0.30), inset 0 1px 0 rgba(255,255,255,0.22)",
          }}
        >
          {Ic.sparkle} {t("ctaPrimary")}
        </Btn>
        <Btn
          variant="secondary"
          size="lg"
          href="#extension"
          style={{ width: "100%", justifyContent: "center" }}
        >
          {t("ctaSecondary")} {Ic.arrowR}
        </Btn>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex" }}>
          {(
            [
              ["MT", "#F4D6C2"],
              ["DA", "#D9E0CC"],
              ["RK", "#E4D3DA"],
              ["JS", "#E0D2E0"],
            ] as const
          ).map(([i, c], k) => (
            <div
              key={i}
              style={{
                marginLeft: k === 0 ? 0 : -8,
                border: `2px solid ${T.bg}`,
                borderRadius: "50%",
              }}
            >
              <Avatar initials={i} size={24} color={c} />
            </div>
          ))}
        </div>
        <span style={{ fontSize: 12, color: T.textDim }}>{t("social")}</span>
      </div>

      <div
        style={{
          background: "#0A0E14",
          color: "#fff",
          borderRadius: 12,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          boxShadow:
            "0 20px 50px rgba(10,14,20,0.30), inset 0 0 0 1px rgba(255,255,255,0.06)",
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
          {t("recoveredLabel")}
        </div>
        <div
          style={{
            fontFamily: FF.display,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.025em",
          }}
        >
          ${recovered.toLocaleString()}
        </div>
        <div style={{ fontSize: 11.5, color: "#A89F92" }}>
          {t("recoveredSub")}
        </div>
      </div>
    </section>
  )
}

function MobileSocialProof() {
  const t = useTranslations("landing.mobile.social")
  return (
    <section
      style={{
        padding: "20px 0 24px",
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
        background: T.surfaceAlt,
      }}
    >
      <div
        style={{
          padding: "0 20px 10px",
          fontFamily: FF.mono,
          fontSize: 10.5,
          color: T.textMute,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {t("livesInside")}
      </div>
      <div
        style={{
          display: "flex",
          gap: 26,
          overflowX: "auto",
          padding: "0 20px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {[
          "DAT One",
          "Truckstop",
          "123Loadboard",
          "NextLoad",
          "Direct Freight",
          "Trucker Path",
        ].map((n) => (
          <span
            key={n}
            style={{
              fontFamily: FF.display,
              fontSize: 17,
              fontWeight: 600,
              color: T.textDim,
              letterSpacing: "-0.015em",
              whiteSpace: "nowrap",
              opacity: 0.7,
            }}
          >
            {n}
          </span>
        ))}
      </div>
    </section>
  )
}

function MobileExtension() {
  const t = useTranslations("landing.mobile.extension")
  const benefitIcons = [Ic.shield, Ic.bolt, Ic.dollar]
  const benefits = t.raw("benefits") as Array<{ t: string; d: string }>
  const rows = [
    { name: "Atlas Freight Brokers", score: 87, tone: "success" as const, mc: 839201 },
    { name: "BlueWave Transport", score: 41, tone: "danger" as const, mc: 721903, selected: true },
    { name: "CH Robinson", score: 89, tone: "success" as const, mc: 114502 },
    { name: "Coyote Logistics", score: 62, tone: "warn" as const, mc: 281042 },
  ]
  return (
    <section id="extension" style={{ padding: "40px 20px 12px", scrollMarginTop: 72 }}>
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
          fontSize: 30,
          fontWeight: 600,
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          margin: "6px 0 10px",
          color: T.text,
        }}
      >
        {t("title")}
      </h2>
      <p style={{ fontSize: 14.5, color: T.textDim, margin: 0, lineHeight: 1.5 }}>
        {t("subtitle")}
      </p>

      <div
        style={{
          marginTop: 22,
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow:
            "0 20px 50px -20px rgba(10,14,20,0.20), 0 0 0 1px rgba(10,14,20,0.04)",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            borderBottom: `1px solid ${T.border}`,
            background: T.surfaceAlt,
            fontFamily: FF.mono,
            fontSize: 10,
            color: T.textMute,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {t("boardLabel")}
        </div>
        {rows.map((r, i) => (
          <div
            key={r.name}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 40px",
              gap: 10,
              alignItems: "center",
              padding: "12px 14px",
              background: r.selected ? T.orangeTint : "transparent",
              borderBottom:
                i < rows.length - 1 ? `1px solid ${T.divider}` : "none",
              borderLeft: r.selected
                ? `3px solid ${T.orange}`
                : "3px solid transparent",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: r.selected ? 600 : 500,
                  color: T.text,
                }}
              >
                {r.name}
              </div>
              <div
                style={{
                  fontFamily: FF.mono,
                  fontSize: 11,
                  color: T.textMute,
                  marginTop: 2,
                }}
              >
                MC-{r.mc}
              </div>
            </div>
            <span
              style={{
                width: 30,
                height: 24,
                borderRadius: 4,
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
                fontSize: 12,
                border: `1px solid ${
                  r.tone === "success"
                    ? "#B5DEC4"
                    : r.tone === "warn"
                      ? "#E2C885"
                      : "#F0B9B0"
                }`,
              }}
            >
              {r.score}
            </span>
          </div>
        ))}

        <div
          style={{
            padding: 14,
            background: T.orangeTint,
            borderTop: `1px solid ${T.borderStrong}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: FF.mono,
              fontSize: 10,
              color: T.orangeDeep,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {Ic.sparkle} {t("aiVerdict")}
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: T.text,
              marginTop: 6,
              lineHeight: 1.4,
            }}
          >
            <span style={{ fontWeight: 600 }}>{t("aiBold")}</span> {t("aiBody")}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 28,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {benefits.map((b, i) => (
          <div
            key={b.t}
            style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: T.orangeTint,
                color: T.orangeDeep,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {benefitIcons[i]}
            </div>
            <div>
              <div
                style={{
                  fontFamily: FF.display,
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: "-0.015em",
                  color: T.text,
                }}
              >
                {b.t}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: T.textDim,
                  marginTop: 3,
                  lineHeight: 1.45,
                }}
              >
                {b.d}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function MobilePricing() {
  const t = useTranslations("landing.mobile.pricing")
  const freeFeatures = t.raw("freeFeatures") as string[]
  const proFeatures = t.raw("proFeatures") as string[]
  return (
    <section
      id="pricing"
      style={{
        padding: "48px 20px",
        background: T.surfaceAlt,
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
        scrollMarginTop: 72,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 28 }}>
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
            fontSize: 28,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            margin: "6px 0 8px",
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
            }}
          >
            {t("titleItalic")}
          </span>
          {t("titleRest")}
        </h2>
        <p style={{ fontSize: 14, color: T.textDim, margin: 0, lineHeight: 1.5 }}>
          {t("subtitle")}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                fontFamily: FF.display,
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              {t("freeName")}
            </div>
            <Pill tone="neutral">{t("freeBadge")}</Pill>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              marginBottom: 2,
            }}
          >
            <span
              style={{
                fontFamily: FF.display,
                fontSize: 44,
                fontWeight: 600,
                letterSpacing: "-0.04em",
                color: T.text,
              }}
            >
              {t("freePrice")}
            </span>
            <span style={{ fontSize: 13, color: T.textDim }}>{t("perMo")}</span>
          </div>
          <div
            style={{
              fontFamily: FF.mono,
              fontSize: 11,
              color: T.textDim,
              marginBottom: 16,
            }}
          >
            {t("freePlus")}
          </div>
          <Btn
            variant="primary"
            size="md"
            href={CHROME_STORE_URL}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {t("freeCta")}
          </Btn>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {freeFeatures.map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  gap: 8,
                  fontSize: 13,
                  color: T.textDim,
                }}
              >
                <span style={{ color: T.success, display: "flex", marginTop: 2 }}>
                  {Ic.check}
                </span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "#0A0E14",
            color: "#F2EFE9",
            borderRadius: 14,
            padding: 24,
            boxShadow: "0 20px 40px -8px rgba(10,14,20,0.25)",
            position: "relative",
          }}
        >
          <Pill
            style={{
              background: T.orange,
              color: "#fff",
              border: "none",
              position: "absolute",
              top: -10,
              right: 18,
            }}
          >
            {t("proBadge")}
          </Pill>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                fontFamily: FF.display,
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#fff",
              }}
            >
              {t("proName")}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              marginBottom: 2,
            }}
          >
            <span
              style={{
                fontFamily: FF.display,
                fontSize: 44,
                fontWeight: 600,
                letterSpacing: "-0.04em",
                color: "#fff",
              }}
            >
              {t("proPrice")}
            </span>
            <span style={{ fontSize: 13, color: "#A89F92" }}>{t("perMo")}</span>
          </div>
          <div
            style={{
              fontFamily: FF.mono,
              fontSize: 11,
              color: "#A89F92",
              marginBottom: 16,
            }}
          >
            {t("proPlus")}
          </div>
          <Btn
            variant="accent"
            size="md"
            href="#waitlist"
            style={{ width: "100%", justifyContent: "center" }}
          >
            {t("proCta")}
          </Btn>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {proFeatures.map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  gap: 8,
                  fontSize: 13,
                  color: "#D9D2C5",
                }}
              >
                <span style={{ color: T.orange, display: "flex", marginTop: 2 }}>
                  {Ic.check}
                </span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function MobileTestimonial() {
  const t = useTranslations("landing.mobile.testimonial")
  return (
    <section style={{ padding: "40px 20px" }}>
      <div
        style={{
          fontFamily: FF.sans,
          fontSize: 12,
          fontWeight: 600,
          color: T.orange,
          marginBottom: 14,
          letterSpacing: "-0.005em",
        }}
      >
        {t("eyebrow")}
      </div>
      <blockquote
        style={{
          margin: 0,
          fontFamily: FF.display,
          fontSize: 22,
          fontWeight: 600,
          lineHeight: 1.3,
          letterSpacing: "-0.02em",
          color: T.text,
        }}
      >
        <span
          style={{
            fontFamily: FF.italic,
            fontStyle: "italic",
            fontWeight: 400,
            color: T.orange,
            fontSize: 36,
            lineHeight: 0.4,
            display: "block",
            marginBottom: 12,
          }}
        >
          &ldquo;
        </span>
        {t("quote")}
      </blockquote>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 22,
          paddingTop: 18,
          borderTop: `1px solid ${T.divider}`,
        }}
      >
        <Avatar initials="MT" size={40} color="#F4D6C2" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>
            {t("author")}
          </div>
          <div
            style={{
              fontFamily: FF.mono,
              fontSize: 10.5,
              color: T.textMute,
              marginTop: 2,
            }}
          >
            {t("role")}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: FF.display,
              fontSize: 20,
              fontWeight: 600,
              color: T.orange,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {t("stat")}
          </div>
          <div
            style={{
              fontFamily: FF.mono,
              fontSize: 9.5,
              color: T.textMute,
              marginTop: 4,
            }}
          >
            {t("statLbl")}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          marginTop: 18,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: i === 0 ? 18 : 6,
              height: 6,
              borderRadius: 999,
              background: i === 0 ? T.orange : T.surfaceElev,
              transition: "width 280ms cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        ))}
      </div>
    </section>
  )
}

function MobileFAQ() {
  const t = useTranslations("landing.mobile.faq")
  const items = t.raw("items") as Array<{ q: string; a: string }>
  const [open, setOpen] = useState(0)
  return (
    <section
      id="faq"
      style={{
        padding: "40px 20px",
        background: T.surfaceAlt,
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
        scrollMarginTop: 72,
      }}
    >
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
          fontSize: 28,
          fontWeight: 600,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          margin: "6px 0 22px",
          color: T.text,
        }}
      >
        {t("title")}
      </h2>
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
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "16px 0",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  fontFamily: FF.sans,
                }}
              >
                <span
                  style={{
                    fontFamily: FF.display,
                    fontSize: 15.5,
                    fontWeight: 600,
                    color: T.text,
                    letterSpacing: "-0.015em",
                    lineHeight: 1.3,
                  }}
                >
                  {it.q}
                </span>
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: isOpen ? T.orange : T.surfaceElev,
                    color: isOpen ? "#fff" : T.textDim,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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
                      paddingBottom: 16,
                      fontSize: 13.5,
                      lineHeight: 1.55,
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
    </section>
  )
}

function MobileCTA() {
  const t = useTranslations("landing.mobile.cta")
  return (
    <section
      id="waitlist"
      style={{
        padding: "52px 20px",
        textAlign: "center",
        backgroundImage: T.gradient,
        backgroundColor: T.bg,
      }}
    >
      <h2
        style={{
          fontFamily: FF.display,
          fontSize: 30,
          fontWeight: 600,
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          margin: "0 0 14px",
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
          }}
        >
          {t("titleItalic")}
        </span>
        {t("titleRest")}
      </h2>
      <p style={{ fontSize: 14, color: T.textDim, margin: "0 0 22px" }}>
        {t("subtitle")}
      </p>
      <Btn
        variant="accent"
        size="lg"
        href="#waitlist"
        style={{
          width: "100%",
          justifyContent: "center",
          boxShadow:
            "0 1px 2px rgba(214,58,5,0.22), 0 4px 14px -2px rgba(214,58,5,0.30), inset 0 1px 0 rgba(255,255,255,0.22)",
        }}
      >
        {Ic.sparkle} {t("button")}
      </Btn>
    </section>
  )
}

function MobileFooter() {
  const t = useTranslations("landing.mobile.footer")
  const locale = useLocale()
  const cols = t.raw("columns") as Record<
    "product" | "company" | "resources" | "legal",
    { title: string; links: string[] }
  >
  return (
    <footer
      style={{
        padding: "24px 20px 32px",
        background: T.surfaceAlt,
        borderTop: `1px solid ${T.border}`,
      }}
    >
      <Mark color={T.text} size={20} href={homeHref(locale)} />
      <p
        style={{
          fontSize: 12.5,
          color: T.textDim,
          lineHeight: 1.55,
          margin: "10px 0 14px",
        }}
      >
        {t("tagline")}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 18,
          marginBottom: 20,
        }}
      >
        {(["product", "company", "resources", "legal"] as const).map((k) => (
          <div key={k}>
            <div
              style={{
                fontFamily: FF.mono,
                fontSize: 10,
                color: T.textMute,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              {cols[k].title}
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {cols[k].links.map((l) => (
                <li key={l} style={{ fontSize: 12.5, color: T.textDim }}>
                  {l}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div
        style={{
          paddingTop: 14,
          borderTop: `1px solid ${T.border}`,
          fontFamily: FF.mono,
          fontSize: 10,
          color: T.textMute,
          letterSpacing: "0.06em",
        }}
      >
        {t("copyright")}
      </div>
    </footer>
  )
}
