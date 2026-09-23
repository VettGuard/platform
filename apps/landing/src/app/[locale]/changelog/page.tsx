import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@vettguard/i18n/config"

import { StubPage } from "@/components/landing/stub-page"

export default async function Changelog({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <StubPage
      locale={locale as Locale}
      eyebrow="Product"
      title="Changelog"
      intro="What's new in VettGuard — shipped features, AI accuracy wins, and the occasional bug fix."
      lastUpdated="2026-05-16"
    />
  )
}
