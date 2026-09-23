import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@vettguard/i18n/config"

import { LegalStub } from "@/components/landing/stub-page"

export default async function Privacy({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <LegalStub
      locale={locale as Locale}
      title="Privacy Policy"
      intro="How VettGuard collects, stores, and uses your data. GDPR + CCPA compliant; full DSAR/export/deletion endpoints land in Phase 4."
    />
  )
}
