import { setRequestLocale } from "next-intl/server"
import type { Locale } from "@vettguard/i18n/config"

import { LegalStub } from "@/components/landing/stub-page"

export default async function Terms({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <LegalStub
      locale={locale as Locale}
      title="Terms of Service"
      intro="The terms that govern your use of VettGuard. Full document being finalized with counsel ahead of Phase 4 launch."
    />
  )
}
