import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@vettguard/i18n/config"

import { StubPage } from "@/components/landing/stub-page"

export default async function Press({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <StubPage
      locale={locale as Locale}
      eyebrow="Company"
      title="Press & media kit"
      intro="Logos, founder bios, and product screenshots. Email press@vettguard.com for interviews and embargoed briefings."
      lastUpdated="2026-05-16"
    />
  )
}
