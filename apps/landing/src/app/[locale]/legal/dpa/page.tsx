import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@vettguard/i18n/config"

import { LegalStub } from "@/components/landing/stub-page"

export default async function DPA({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <LegalStub
      locale={locale as Locale}
      title="Data Processing Agreement"
      intro="Our DPA covers GDPR Article 28 obligations. Email legal@vettguard.com for an executable copy ahead of Phase 4."
    />
  )
}
