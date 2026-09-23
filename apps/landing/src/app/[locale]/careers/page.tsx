import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@vettguard/i18n/config"

import { StubPage } from "@/components/landing/stub-page"

export default async function Careers({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <StubPage
      locale={locale as Locale}
      eyebrow="Company"
      title="Careers at VettGuard"
      intro="We're building the AI copilot for US dispatchers. Remote-first, distributed across Tashkent and Chicago."
      lastUpdated="2026-05-16"
    />
  )
}
