import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@vettguard/i18n/config"

import { StubPage } from "@/components/landing/stub-page"

export default async function Guide({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <StubPage
      locale={locale as Locale}
      eyebrow="Resources"
      title="Carrier guide"
      intro="Everything a US dispatcher needs to know about broker vetting, detention claims, and how to make AI carry the paperwork."
      lastUpdated="2026-05-16"
    />
  )
}
