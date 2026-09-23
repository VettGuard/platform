import { getTranslations, setRequestLocale } from "next-intl/server"

import type { Locale } from "@vettguard/i18n/config"
import { Hero, LandingNav } from "@/components/landing/hero"
import { JsonLd } from "@/components/landing/json-ld"
import { MobileLanding } from "@/components/landing/mobile"
import { Reveal } from "@/components/landing/reveal"
import {
  Benefits,
  Comparison,
  DemoVideo,
  ExtensionShowcase,
  FAQDesktop,
  FooterCTA,
  HowItWorks,
  LandingFooter,
  PressStrip,
  Pricing,
  ROICalculator,
  Testimonials,
  TrustBar,
} from "@/components/landing/sections"

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // FAQPage schema sourced from i18n so Google's rich-result FAQ block
  // matches the rendered page exactly (Google validates Q/A pairs against
  // visible DOM text). Falls back silently if the i18n shape changes.
  const tFaq = await getTranslations({ locale, namespace: "landing.extras.faqDesktop" })
  const faqItems = tFaq.raw("items") as Array<{ q: string; a: string }>
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  }

  return (
    // Background/foreground tokens flip via [data-theme] on <html>; we use
    // CSS vars so a theme switch re-paints without re-rendering React.
    // Desktop + mobile compositions both render server-side; .vg-desktop-only
    // / .vg-mobile-only in globals.css swap them at the 768px breakpoint —
    // no JS, no hydration mismatch, no FOUC.
    <div style={{ background: "var(--vg-bg)", color: "var(--vg-text)" }}>
      <JsonLd data={faqLd} />
      <div className="vg-desktop-only">
        <LandingNav locale={locale as Locale} />
        <Hero />
        <Reveal><PressStrip /></Reveal>
        <Reveal><TrustBar /></Reveal>
        <Reveal><Benefits /></Reveal>
        <Reveal><ExtensionShowcase /></Reveal>
        <Reveal><DemoVideo /></Reveal>
        <Reveal><HowItWorks /></Reveal>
        <Reveal><ROICalculator /></Reveal>
        <Reveal><Comparison /></Reveal>
        <Reveal><Testimonials /></Reveal>
        <Reveal><Pricing /></Reveal>
        <Reveal><FAQDesktop /></Reveal>
        <Reveal><FooterCTA /></Reveal>
        <LandingFooter />
      </div>
      <div className="vg-mobile-only">
        <MobileLanding />
      </div>
    </div>
  )
}
