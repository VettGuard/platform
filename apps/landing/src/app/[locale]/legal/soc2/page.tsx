import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@vettguard/i18n/config"

import { LegalStub } from "@/components/landing/stub-page"

export default async function SOC2({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <LegalStub
      locale={locale as Locale}
      title="SOC 2 compliance"
      intro="VettGuard is targeting SOC 2 Type I readiness in Phase 4 and Type II observation through Year 2. Reports available under NDA — email security@vettguard.com."
    />
  )
}
