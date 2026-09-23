import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@vettguard/i18n/config"

import { StubPage } from "@/components/landing/stub-page"

export default async function Help({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <StubPage
      locale={locale as Locale}
      eyebrow="Resources"
      title="Help center"
      intro="Browse common questions or email support@vettguard.com. 48-hour response on Free, 24-hour SLA on Pro."
      lastUpdated="2026-05-16"
    />
  )
}
